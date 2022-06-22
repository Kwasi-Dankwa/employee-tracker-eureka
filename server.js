//Adding Dependencies needed - inquirer,mysql2,console.table packages
const inquirer = require("inquirer");
const mysql = require('mysql2');
const table = require('console.table');
require('dotenv').config()

//Create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: '',
    database: 'employees_db'
});




