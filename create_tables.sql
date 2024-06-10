-- MySQL Script to create the database and tables
CREATE DATABASE mini_crm;

USE mini_crm;

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    total_spends DECIMAL(10, 2) DEFAULT 0,
    visits INT DEFAULT 0,
    last_visit DATE
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE communications_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    message TEXT,
    status VARCHAR(50),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
