CREATE DATABASE IF NOT EXISTS car_rental_service
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE car_rental_service;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  category VARCHAR(60) NOT NULL,
  registration_no VARCHAR(40) NOT NULL UNIQUE,
  year SMALLINT,
  seats TINYINT NOT NULL DEFAULT 5,
  fuel_type VARCHAR(30) DEFAULT 'Petrol',
  transmission VARCHAR(30) DEFAULT 'Automatic',
  price_per_day DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  description TEXT,
  status ENUM('available','maintenance','inactive') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  pickup_date DATE NOT NULL,
  return_date DATE NOT NULL,
  pickup_location VARCHAR(180) NOT NULL,
  dropoff_location VARCHAR(180) NOT NULL,
  days INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_vehicle_dates (vehicle_id, pickup_date, return_date)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('cash','bank_transfer','online') NOT NULL DEFAULT 'cash',
  status ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  transaction_reference VARCHAR(120),
  payment_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  booking_id INT,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uq_feedback_booking (booking_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

INSERT INTO vehicles
(name,brand,model,category,registration_no,year,seats,fuel_type,transmission,price_per_day,image_url,description,status)
VALUES
('Toyota Land Cruiser','Toyota','Land Cruiser','SUV','BP-1-A1234',2022,7,'Diesel','Automatic',6500,
 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1000','Comfortable SUV for long journeys and mountain roads.','available'),
('Hyundai Creta','Hyundai','Creta','SUV','BP-1-B2345',2023,5,'Petrol','Automatic',3800,
 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1000','Practical city and family SUV.','available'),
('Toyota Corolla','Toyota','Corolla','Sedan','BP-1-C3456',2021,5,'Petrol','Automatic',3000,
 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000','Reliable sedan for comfortable daily travel.','available'),
('Suzuki Swift','Suzuki','Swift','Hatchback','BP-1-D4567',2022,5,'Petrol','Manual',2200,
 'https://images.unsplash.com/photo-1597237563760-1a8c4f1f7a2f?w=1000','Compact and economical city car.','available')
ON DUPLICATE KEY UPDATE name=VALUES(name);
