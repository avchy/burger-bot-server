const mysql = require('mysql2/promise')
const { sqlConfig } = require('../../constants/config')
const axios = require('axios')
const https = require('https')
const { generateDateTime } = require('../helpers/utils')

class dishesService {
  constructor() {
    this.pool = mysql.createPool(sqlConfig) // Создаем пул соединений
  }

  // Метод для выполнения запросов к базе данных
  async executeQuery(sqlQuery, values) {
    const connection = await this.pool.getConnection()

    try {
      const [results] = await connection.execute(sqlQuery, values)
      return results
    } catch (error) {
      console.error('Error executing SQL query:', error)
      throw error
    } finally {
      connection.release() // Вернуть соединение в пул после использования
    }
  }

  // createDish ================================================

  // async createDish(data) {
  async createDish(req, res) {
    console.log('req.body :>> ', req.body)
    const { title, price, image, description, toppings, restaurant_name } = req.body
    // async createDish({ title, price, image, description, toppings, restaurant_name }) {
    const sqlQuery = `
        INSERT INTO dishes (title, price, image, description, restaurant_name)
        VALUES (?, ?, ?, ?, ?)
      `

    try {
      // Replace undefined values with null
      const values = [title || null, price || null, image || null, description || null, restaurant_name || null]

      // Insert the dish into the 'dishes' table
      const result = await this.executeQuery(sqlQuery, values)

      // If toppings are provided, insert them into the 'toppings' table
      if (toppings && toppings.length > 0) {
        const dishId = result.insertId
        await this.insertToppings(dishId, toppings)
      }

      return result
    } catch (error) {
      console.error('Error creating dish:', error)
      throw error
    }
  }

  // Helper method to insert toppings for a dish
  async insertToppings(dishId, toppings) {
    console.log('dishId,   :>> ', dishId)
    console.log(' , toppings :>> ', toppings)

    const sqlQuery = `
    INSERT INTO toppings (dish_id, title, price, image)
    VALUES (?, ?, ?, ?)
  `

    toppings.map(async (topping) => {
      const values = [dishId, topping.title, topping.price, topping.image]
      try {
        // Insert toppings into the 'toppings' table
        await this.executeQuery(sqlQuery, values)
      } catch (error) {
        console.error('Error inserting toppings:', error)
        throw error
      }
    })
  }

  // getDishes ================================================
  async getDishes() {
    const sqlQuery = `SELECT
     m.id AS id, 
     m.title,
     m.price,
     m.image,
     m.description,
     (
       SELECT 
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'title', t.title,  
             'price', t.price,
             'image', t.image
           )
         )
       FROM toppings t 
       WHERE t.dish_id = m.id
     ) AS toppings  
   FROM dishes m`

    return this.executeQuery(sqlQuery, [])
  }

  // getDishesByRestaurantName ================================================
  async getDishesByRestaurantName(restaurant_name) {
    console.log('restaurant_name', restaurant_name)
    const sqlQuery = `
    SELECT
      m.id AS id, 
      m.title,
      m.price,
      m.image,
      m.description,
      (
        SELECT 
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'title', t.title,  
              'price', t.price,
              'image', t.image
            )
          )
        FROM toppings t 
        WHERE t.dish_id = m.id
      ) AS toppings  
    FROM dishes m
    WHERE m.restaurant_name = ?
  `

    return this.executeQuery(sqlQuery, [restaurant_name])
  }

  // getToppings ================================================
  async getToppings() {
    const sqlQuery = 'SELECT * FROM toppings'
    return this.executeQuery(sqlQuery, [])
  }

  // getToppingsByRestaurantName ================================================
  async getToppingsByRestaurantName(restaurant_name) {
    console.log('restaurant_name', restaurant_name)
    const sqlQuery = `
      SELECT
        t.id  , 
        t.title,
        t.price,
        t.image,
        t.dish_id,
        t.restaurant_name
      FROM toppings t
      WHERE t.restaurant_name = ?
    `
    return this.executeQuery(sqlQuery, [restaurant_name])
  }

  // getCategories ================================================
  async getCategories() {
    const sqlQuery = 'SELECT * FROM categories'
    return this.executeQuery(sqlQuery, [])
  }
}

module.exports = new dishesService()
