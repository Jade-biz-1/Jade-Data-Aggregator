CREATE DATABASE IF NOT EXISTS TestDatabase;
USE TestDatabase;

-- Create users and grant privileges
CREATE USER 'admin'@'%' IDENTIFIED BY 'dsp101';
GRANT ALL PRIVILEGES ON TestDatabase.* TO 'admin'@'%';

CREATE USER 'deepak'@'%' IDENTIFIED BY 'dsp101';
GRANT SELECT, INSERT, UPDATE, DELETE ON TestDatabase.* TO 'deepak'@'%';

FLUSH PRIVILEGES;

-- Create Person table
CREATE TABLE Person (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    address VARCHAR(255),
    phone_number VARCHAR(20)
);

-- Create PersonDetails table
CREATE TABLE PersonDetails (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT,
    employment_company VARCHAR(100),
    employment_role VARCHAR(100),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (person_id) REFERENCES Person(id) ON DELETE CASCADE
);

-- Insert sample data into Person table
INSERT INTO Person (first_name, last_name, address, phone_number) VALUES
('John', 'Doe', '123 Main St, Anytown, USA', '555-1234'),
('Jane', 'Smith', '456 Oak Ave, Anytown, USA', '555-5678'),
('Peter', 'Jones', '789 Pine Ln, Anytown, USA', '555-9012');

-- Insert sample data into PersonDetails table
INSERT INTO PersonDetails (person_id, employment_company, employment_role, start_date, end_date) VALUES
(1, 'ABC Corp', 'Software Engineer', '2020-01-15', '2022-05-30'),
(1, 'XYZ Inc', 'Senior Software Engineer', '2022-06-01', NULL),
(2, 'Data Solutions', 'Data Analyst', '2019-07-20', '2021-12-31'),
(3, 'Tech Innovations', 'Project Manager', '2018-03-10', NULL);
