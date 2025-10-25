# Sample Data for Tutorial

This directory contains sample datasets for learning and practicing with the Data Aggregator Platform. The data is organized into three main categories: E-commerce, IoT (Internet of Things), and Financial services.

## 📁 Directory Structure

```
sample-data/
├── ecommerce/           # E-commerce business data
│   ├── orders.csv      # Customer orders (100 records)
│   ├── customers.json  # Customer information (50 records)
│   └── products.json   # Product catalog (30 products)
├── iot/                 # IoT sensor data
│   ├── sensor-readings.json  # Sensor measurements (1000 readings)
│   └── devices.json    # IoT device inventory (20 devices)
├── financial/           # Financial services data
│   ├── transactions.csv  # Financial transactions (200 records)
│   └── accounts.json   # Account information (15 accounts)
└── README.md           # This file
```

## 📊 Dataset Details

### E-commerce Data

#### orders.csv (100 records)
Customer order transactions for an online retail business.

**Fields:**
- `order_id`: Unique order identifier (ORD-001 to ORD-100)
- `customer_id`: Customer identifier (CUST-001 to CUST-050)
- `order_date`: Order timestamp (Jan-Feb 2024)
- `total_amount`: Order total in USD
- `status`: Order status (completed, processing, shipped, cancelled)
- `payment_method`: Payment type (credit_card, debit_card, paypal)
- `shipping_address`: Full shipping address
- `product_ids`: Comma-separated product IDs

**Use Cases:**
- Sales analytics and trend analysis
- Customer behavior patterns
- Order status tracking
- Revenue reporting

#### customers.json (50 records)
Customer profile and demographic information.

**Fields:**
- `customer_id`: Unique customer identifier
- `first_name`, `last_name`: Customer name
- `email`, `phone`: Contact information
- `address`, `city`, `state`, `zip_code`, `country`: Location data
- `registration_date`: Account creation date
- `last_purchase_date`: Most recent order
- `total_purchases`: Number of orders
- `lifetime_value`: Total spend in USD
- `customer_segment`: Segmentation (premium, regular)
- `email_opt_in`: Marketing consent

**Use Cases:**
- Customer segmentation
- Lifetime value analysis
- Geographic distribution
- Marketing campaign targeting

#### products.json (30 products)
Product catalog with pricing and inventory.

**Fields:**
- `product_id`: Unique product identifier (PROD-001 to PROD-030)
- `name`: Product name
- `category`: Product category
- `price`: Retail price in USD
- `cost`: Cost of goods sold
- `stock`: Current inventory level
- `description`: Product description
- `brand`: Brand name
- `rating`: Average customer rating (0-5)
- `reviews`: Number of reviews

**Use Cases:**
- Inventory management
- Pricing analysis
- Profit margin calculations
- Product performance tracking

### IoT Data

#### sensor-readings.json (1000 readings)
Time-series sensor measurements from IoT devices.

**Fields:**
- `reading_id`: Unique reading identifier (READ-000001 to READ-001000)
- `device_id`: Device that recorded the reading
- `sensor_type`: Type of sensor (temperature, humidity, pressure, light, motion, air_quality)
- `value`: Measured value
- `unit`: Unit of measurement (celsius, percent, hPa, lux, binary, AQI)
- `timestamp`: Measurement timestamp (15-minute intervals)
- `status`: Reading status (normal, warning, critical)
- `battery_level`: Device battery percentage

**Use Cases:**
- Environmental monitoring
- Anomaly detection
- Predictive maintenance
- Energy optimization

#### devices.json (20 devices)
IoT device inventory and metadata.

**Fields:**
- `device_id`: Unique device identifier (DEV-001 to DEV-020)
- `name`: Device name
- `type`: Sensor type
- `location`: Physical installation location
- `installation_date`: Deployment date
- `status`: Operational status (active, inactive, maintenance)
- `firmware_version`: Current firmware
- `last_maintenance`: Last maintenance date

**Use Cases:**
- Asset management
- Maintenance scheduling
- Device lifecycle tracking
- Network topology mapping

### Financial Data

#### transactions.csv (200 records)
Financial account transactions.

**Fields:**
- `transaction_id`: Unique transaction identifier (TXN-000001 to TXN-000200)
- `account_id`: Account identifier
- `timestamp`: Transaction date and time
- `type`: Transaction type (deposit, withdrawal, transfer, payment, fee)
- `amount`: Transaction amount in USD
- `currency`: Currency code (USD)
- `category`: Transaction category (salary, groceries, utilities, etc.)
- `description`: Transaction description
- `status`: Transaction status (completed, pending)
- `balance_after`: Account balance after transaction

**Use Cases:**
- Cash flow analysis
- Spending patterns
- Budget tracking
- Fraud detection

#### accounts.json (15 accounts)
Financial account information.

**Fields:**
- `account_id`: Unique account identifier (ACC-0001 to ACC-0015)
- `account_number`: Account number
- `account_type`: Type (checking, savings, investment)
- `account_name`: Account nickname
- `customer_name`: Account holder name
- `balance`: Current balance in USD
- `currency`: Currency code (USD)
- `status`: Account status (active, inactive)
- `opened_date`: Account opening date
- `interest_rate`: Annual interest rate percentage

**Use Cases:**
- Account portfolio analysis
- Interest calculations
- Customer relationship management
- Balance trending

## 🎯 Tutorial Scenarios

### Scenario 1: E-commerce Analytics Pipeline
**Goal:** Analyze customer purchasing behavior

**Steps:**
1. Connect to `orders.csv` and `customers.json`
2. Join data on `customer_id`
3. Transform: Calculate customer LTV, average order value
4. Load into analytics dashboard

### Scenario 2: IoT Data Monitoring
**Goal:** Monitor environmental conditions

**Steps:**
1. Connect to `sensor-readings.json` and `devices.json`
2. Filter: Find readings with status = "warning" or "critical"
3. Transform: Aggregate by device and location
4. Load into alerting system

### Scenario 3: Financial Reporting
**Goal:** Generate monthly financial statements

**Steps:**
1. Connect to `transactions.csv` and `accounts.json`
2. Filter: Transactions from specific date range
3. Transform: Categorize and summarize by type
4. Load into reporting database

## 📝 Data Characteristics

### Data Quality
- **Completeness:** All required fields populated
- **Consistency:** Standardized formats and codes
- **Realistic:** Values within expected ranges
- **Relationships:** Proper foreign key references

### Data Volume
- **Total Records:** 1,385 records across all files
- **Total Size:** ~2.5 MB
- **File Formats:** CSV (2 files), JSON (5 files)

### Time Periods
- **E-commerce:** January - February 2024
- **IoT:** January 2024 (15-minute intervals)
- **Financial:** January 2024 (random timestamps)

## 🔧 Usage Tips

### Loading CSV Files
```javascript
// Example connector configuration
{
  "connector_type": "csv",
  "config": {
    "file_path": "/sample-data/ecommerce/orders.csv",
    "delimiter": ",",
    "has_header": true,
    "encoding": "utf-8"
  }
}
```

### Loading JSON Files
```javascript
// Example connector configuration
{
  "connector_type": "json",
  "config": {
    "file_path": "/sample-data/iot/devices.json",
    "json_path": "$",
    "flatten": true
  }
}
```

### Common Transformations
- **Filtering:** Extract specific date ranges or statuses
- **Aggregation:** Sum, average, count by category
- **Joining:** Combine related datasets
- **Enrichment:** Add calculated fields
- **Formatting:** Standardize data types and formats

## 🚀 Getting Started

1. **Explore the Data**: Browse the files to understand structure
2. **Choose a Scenario**: Pick one of the tutorial scenarios
3. **Create Connectors**: Set up data source connections
4. **Build Transformations**: Apply business logic
5. **Create Pipeline**: Orchestrate the data flow
6. **Test & Validate**: Verify results

## 📚 Additional Resources

- [Platform Documentation](../../../docs/)
- [Connector Configuration Guide](../../../docs/connectors.md)
- [Transformation Functions](../../../docs/transformations.md)
- [Pipeline Builder](../../../docs/pipelines.md)

## 🔄 Data Refresh

This sample data is static and provided for learning purposes. In a production environment, you would connect to live data sources that update in real-time.

## 📄 License

This sample data is provided for educational purposes as part of the Data Aggregator Platform Tutorial. Feel free to modify and extend for your learning needs.

---

**Last Updated:** October 25, 2025
**Version:** 1.0
**Total Records:** 1,385
