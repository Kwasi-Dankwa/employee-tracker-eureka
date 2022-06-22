//Adding Dependencies needed - inquirer,mysql2,console.table packages
const inquirer = require("inquirer");
const mysql = require('mysql2');
require('console.table');
require('dotenv').config()

//Create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'process.env.DB_PASSWORD',
    database: 'employees_db'
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    console.log(`
    ╔═══╗─────╔╗──────────────╔═╗╔═╗
    ║╔══╝─────║║──────────────║║╚╝║║
    ║╚══╦╗╔╦══╣║╔══╦╗─╔╦══╦══╗║╔╗╔╗╠══╦═╗╔══╦══╦══╦═╗
    ║╔══╣╚╝║╔╗║║║╔╗║║─║║║═╣║═╣║║║║║║╔╗║╔╗╣╔╗║╔╗║║═╣╔╝
    ║╚══╣║║║╚╝║╚╣╚╝║╚═╝║║═╣║═╣║║║║║║╔╗║║║║╔╗║╚╝║║═╣║
    ╚═══╩╩╩╣╔═╩═╩══╩═╗╔╩══╩══╝╚╝╚╝╚╩╝╚╩╝╚╩╝╚╩═╗╠══╩╝
    ───────║║──────╔═╝║─────────────────────╔═╝║
    ───────╚╝──────╚══╝─────────────────────╚══╝`)
    // runs the CLI once command is invoked
    runApp();
});

//function to provide user with the interface for interaction
function runApp() {
    inquirer.prompt({
        type: "list",
        name: "task",
        message: "Would you like to do?",
        choices: [
            "View Employees",
            "View Employees by Department",
            "Add Employee",
            "Remove Employees",
            "Update Employee Role",
            "Add Role",
            "End"]
    })
        .then(function ({ task }) {
            switch (task) {
                //View Employee
                case "View Employees":
                    viewEmployee();
                    break;

                case "View Employees by Department":
                    viewEmployeeByDepartment();
                    break;

                case "Add Employee":
                    addEmployee();
                    break;

                case "Remove Employees":
                    removeEmployees();
                    break;

                case "Update Employee Role":
                    updateEmployeeRole();
                    break;

                case "Add Role":
                    addRole();
                    break;

                case "End":
                    connection.end();
                    break;
            }
        });
}

// function to display all departments 
displayDepartments = () => {
    console.log('Displaying all departments...\n');
    const sql = `SELECT department.id AS id, department.name AS department FROM department`;

    connection.promise().query(sql, (err, rows) => {
        if (err) throw err;
        console.table(rows);
        promptUser();
    });
};

// function to display all roles 
displayRoles = () => {
    console.log('Displaying all roles...\n');

    const sql = `SELECT role.id, role.title, department.name AS department
                 FROM role
                 INNER JOIN department ON role.department_id = department.id`;

    connection.promise().query(sql, (err, rows) => {
        if (err) throw err;
        console.table(rows);
        promptUser();
    })
};

// function to display all employees 
displayEmployees = () => {
    console.log('Showing all employees...\n');
    const sql = `SELECT employee.id, 
                        employee.first_name, 
                        employee.last_name, 
                        role.title, 
                        department.name AS department,
                        role.salary, 
                        CONCAT (manager.first_name, " ", manager.last_name) AS manager
                 FROM employee
                        LEFT JOIN role ON employee.role_id = role.id
                        LEFT JOIN department ON role.department_id = department.id
                        LEFT JOIN employee manager ON employee.manager_id = manager.id`;

    connection.promise().query(sql, (err, rows) => {
        if (err) throw err;
        console.table(rows);
        promptUser();
    });
};

// function to add a department 
addDepartment = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'addDept',
            message: "What department do you want to add?",
            validate: addDept => {
                if (addDept) {
                    return true;
                } else {
                    console.log('Please enter a department');
                    return false;
                }
            }
        }
    ])
        .then(answer => {
            const sql = `INSERT INTO department (name)
                    VALUES (?)`;
            connection.query(sql, answer.addDept, (err, result) => {
                if (err) throw err;
                console.log('Added ' + answer.addDept + " to departments!");

                displayDepartments();
            });
        });
};

// function to add a role 
addRole = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'role',
            message: "What role do you want to add?",
            validate: addRole => {
                if (addRole) {
                    return true;
                } else {
                    console.log('Please enter a role');
                    return false;
                }
            }
        },
        {
            type: 'input',
            name: 'salary',
            message: "What is the salary of this role?",
            validate: addSalary => {
                if (isNAN(addSalary)) {
                    return true;
                } else {
                    console.log('Please enter a salary');
                    return false;
                }
            }
        }
    ])
        .then(answer => {
            const params = [answer.role, answer.salary];

            // grab dept from department table
            const roleSql = `SELECT name, id FROM department`;

            connection.promise().query(roleSql, (err, data) => {
                if (err) throw err;

                const dept = data.map(({ name, id }) => ({ name: name, value: id }));

                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'dept',
                        message: "What department is this role in?",
                        choices: dept
                    }
                ])
                    .then(deptChoice => {
                        const dept = deptChoice.dept;
                        params.push(dept);

                        const sql = `INSERT INTO role (title, salary, department_id)
                          VALUES (?, ?, ?)`;

                        connection.query(sql, params, (err, result) => {
                            if (err) throw err;
                            console.log('Added' + answer.role + " to roles!");

                            displayRoles();
                        });
                    });
            });
        });
};

// function to add an employee 
addEmployee = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'fistName',
            message: "What is the employee's first name?",
            validate: addFirst => {
                if (addFirst) {
                    return true;
                } else {
                    console.log('Please enter a first name');
                    return false;
                }
            }
        },
        {
            type: 'input',
            name: 'lastName',
            message: "What is the employee's last name?",
            validate: addLast => {
                if (addLast) {
                    return true;
                } else {
                    console.log('Please enter a last name');
                    return false;
                }
            }
        }
    ])
        .then(answer => {
            const params = [answer.fistName, answer.lastName]

            // grab roles from roles table
            const roleSql = `SELECT role.id, role.title FROM role`;

            connection.promise().query(roleSql, (err, data) => {
                if (err) throw err;

                const roles = data.map(({ id, title }) => ({ name: title, value: id }));

                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'role',
                        message: "What is the employee's role?",
                        choices: roles
                    }
                ])
                    .then(roleChoice => {
                        const role = roleChoice.role;
                        params.push(role);

                        const managerSql = `SELECT * FROM employee`;

                        connection.promise().query(managerSql, (err, data) => {
                            if (err) throw err;

                            const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

                            // console.log(managers);

                            inquirer.prompt([
                                {
                                    type: 'list',
                                    name: 'manager',
                                    message: "Who is the employee's manager?",
                                    choices: managers
                                }
                            ])
                                .then(managerChoice => {
                                    const manager = managerChoice.manager;
                                    params.push(manager);

                                    const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
                      VALUES (?, ?, ?, ?)`;

                                    connection.query(sql, params, (err, result) => {
                                        if (err) throw err;
                                        console.log("Employee has been added!")

                                        displayEmployees();
                                    });
                                });
                        });
                    });
            });
        });
};

// function to update an employee 
updateEmployee = () => {
    // get all employees from employee table 
    const employeeSql = `SELECT * FROM employee`;

    connection.promise().query(employeeSql, (err, data) => {
        if (err) throw err;

        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: "Which employee would you like to update?",
                choices: employees
            }
        ])
            .then(empChoice => {
                const employee = empChoice.name;
                const params = [];
                params.push(employee);

                const roleSql = `SELECT * FROM role`;

                connection.promise().query(roleSql, (err, data) => {
                    if (err) throw err;

                    const roles = data.map(({ id, title }) => ({ name: title, value: id }));

                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'role',
                            message: "What is the employee's new role?",
                            choices: roles
                        }
                    ])
                        .then(roleChoice => {
                            const role = roleChoice.role;
                            params.push(role);

                            let employee = params[0]
                            params[0] = role
                            params[1] = employee


                            // console.log(params)

                            const sql = `UPDATE employee SET role_id = ? WHERE id = ?`;

                            connection.query(sql, params, (err, result) => {
                                if (err) throw err;
                                console.log("Employee has been updated!");

                                displayEmployees();
                            });
                        });
                });
            });
    });
};

// function to update an employee 
updateManager = () => {
    // get all employees from employee table 
    const employeeSql = `SELECT * FROM employee`;

    connection.promise().query(employeeSql, (err, data) => {
        if (err) throw err;

        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: "Which employee would you like to update?",
                choices: employees
            }
        ])
            .then(empChoice => {
                const employee = empChoice.name;
                const params = [];
                params.push(employee);

                const managerSql = `SELECT * FROM employee`;

                connection.promise().query(managerSql, (err, data) => {
                    if (err) throw err;

                    const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'manager',
                            message: "Who is the employee's manager?",
                            choices: managers
                        }
                    ])
                        .then(managerChoice => {
                            const manager = managerChoice.manager;
                            params.push(manager);

                            let employee = params[0]
                            params[0] = manager
                            params[1] = employee


                            // console.log(params)

                            const sql = `UPDATE employee SET manager_id = ? WHERE id = ?`;

                            connection.query(sql, params, (err, result) => {
                                if (err) throw err;
                                console.log("Employee has been updated!");

                                displayEmployees();
                            });
                        });
                });
            });
    });
};

// View employee by department
employeeDepartment = () => {
    console.log('Showing employee by departments...\n');
    const sql = `SELECT employee.first_name, 
                        employee.last_name, 
                        department.name AS department
                 FROM employee 
                 LEFT JOIN role ON employee.role_id = role.id 
                 LEFT JOIN department ON role.department_id = department.id`;

    connection.promise().query(sql, (err, rows) => {
        if (err) throw err;
        console.table(rows);
        promptUser();
    });
};

// Delete department
deleteDepartment = () => {
    const deptSql = `SELECT * FROM department`;

    connection.promise().query(deptSql, (err, data) => {
        if (err) throw err;

        const dept = data.map(({ name, id }) => ({ name: name, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'dept',
                message: "What department do you want to delete?",
                choices: dept
            }
        ])
            .then(deptChoice => {
                const dept = deptChoice.dept;
                const sql = `DELETE FROM department WHERE id = ?`;

                connection.query(sql, dept, (err, result) => {
                    if (err) throw err;
                    console.log("Successfully deleted!");

                    displayDepartments();
                });
            });
    });
};

// function to delete role
deleteRole = () => {
    const roleSql = `SELECT * FROM role`;

    connection.promise().query(roleSql, (err, data) => {
        if (err) throw err;

        const role = data.map(({ title, id }) => ({ name: title, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'role',
                message: "What role do you want to delete?",
                choices: role
            }
        ])
            .then(roleChoice => {
                const role = roleChoice.role;
                const sql = `DELETE FROM role WHERE id = ?`;

                connection.query(sql, role, (err, result) => {
                    if (err) throw err;
                    console.log("Successfully deleted!");

                    displayRoles();
                });
            });
    });
};

// function to delete employees
deleteEmployee = () => {
    // get employees from employee table 
    const employeeSql = `SELECT * FROM employee`;

    connection.promise().query(employeeSql, (err, data) => {
        if (err) throw err;

        const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }));

        inquirer.prompt([
            {
                type: 'list',
                name: 'name',
                message: "Which employee would you like to delete?",
                choices: employees
            }
        ])
            .then(empChoice => {
                const employee = empChoice.name;

                const sql = `DELETE FROM employee WHERE id = ?`;

                connection.query(sql, employee, (err, result) => {
                    if (err) throw err;
                    console.log("Successfully Deleted!");

                    displayEmployees();
                });
            });
    });
};

// view department budget 
viewBudget = () => {
    console.log('Showing budget by department...\n');

    const sql = `SELECT department_id AS id, 
                        department.name AS department,
                        SUM(salary) AS budget
                 FROM  role  
                 JOIN department ON role.department_id = department.id GROUP BY  department_id`;

    connection.promise().query(sql, (err, rows) => {
        if (err) throw err;
        console.table(rows);

        promptUser();
    });
};




