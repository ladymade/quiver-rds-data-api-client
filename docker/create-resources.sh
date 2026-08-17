#!/usr/bin/env bash

set -euo pipefail

ENDPOINT="http://localhost:4566"
PROFILE="ministack"
REGION="ap-northeast-1"

CLUSTER_ID="local-aurora-mysql"
INSTANCE_ID="local-aurora-mysql-instance"
SECRET_NAME="local-aurora-mysql-secret"

AWS="aws --profile ${PROFILE} --endpoint-url ${ENDPOINT}"

echo "Waiting for MiniStack..."

until ${AWS} sts get-caller-identity >/dev/null 2>&1; do
  sleep 1
done

echo "MiniStack is ready."


# ============================================================
# RDS Cluster
# ============================================================

echo "Creating local RDS Aurora MySQL cluster..."

if ${AWS} rds describe-db-clusters \
  --db-cluster-identifier "${CLUSTER_ID}" \
  >/dev/null 2>&1
then
  echo "RDS cluster '${CLUSTER_ID}' already exists."
else
  ${AWS} rds create-db-cluster \
    --db-cluster-identifier "${CLUSTER_ID}" \
    --engine aurora-mysql \
    --master-username admin \
    --master-user-password localpassword \
    --database-name appdb

  echo "RDS cluster '${CLUSTER_ID}' created."
fi


# ============================================================
# RDS DB Instance
# ============================================================

echo "Creating local RDS Aurora MySQL DB instance..."

if ${AWS} rds describe-db-instances \
  --db-instance-identifier "${INSTANCE_ID}" \
  >/dev/null 2>&1
then
  echo "RDS DB instance '${INSTANCE_ID}' already exists."
else
  ${AWS} rds create-db-instance \
    --db-instance-identifier "${INSTANCE_ID}" \
    --db-cluster-identifier "${CLUSTER_ID}" \
    --db-instance-class db.r6g.large \
    --engine aurora-mysql

  echo "RDS DB instance '${INSTANCE_ID}' created."
fi


echo "Waiting for DB instance to become available..."

until [ "$(
  ${AWS} rds describe-db-instances \
    --db-instance-identifier "${INSTANCE_ID}" \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text
)" = "available" ]; do

  STATUS="$(
    ${AWS} rds describe-db-instances \
      --db-instance-identifier "${INSTANCE_ID}" \
      --query 'DBInstances[0].DBInstanceStatus' \
      --output text
  )"

  echo "DB instance status: ${STATUS}"

  sleep 1
done

echo "DB instance '${INSTANCE_ID}' is available."


# ============================================================
# RDS Data API
# ============================================================

echo "Enabling RDS Data API..."

${AWS} rds enable-http-endpoint \
  --resource-arn \
  "arn:aws:rds:${REGION}:000000000000:cluster:${CLUSTER_ID}"

echo "RDS Data API enabled."


# ============================================================
# Secrets Manager
# ============================================================

echo "Creating Secrets Manager secret..."

if ${AWS} secretsmanager describe-secret \
  --secret-id "${SECRET_NAME}" \
  >/dev/null 2>&1
then
  echo "Secret '${SECRET_NAME}' already exists."
else
  ${AWS} secretsmanager create-secret \
    --name "${SECRET_NAME}" \
    --secret-string '{"username":"admin","password":"localpassword"}'

  echo "Secret '${SECRET_NAME}' created."
fi


# ============================================================
# Check
# ============================================================

echo "Checking cluster..."

${AWS} rds describe-db-clusters \
  --db-cluster-identifier "${CLUSTER_ID}" \
  --query 'DBClusters[0].{Identifier:DBClusterIdentifier,Status:Status,HttpEndpointEnabled:HttpEndpointEnabled,Members:DBClusterMembers,Arn:DBClusterArn}' \
  --output table

echo "Checking DB instance..."

${AWS} rds describe-db-instances \
  --db-instance-identifier "${INSTANCE_ID}" \
  --query 'DBInstances[0].{Identifier:DBInstanceIdentifier,Status:DBInstanceStatus,Cluster:DBClusterIdentifier}' \
  --output table

echo "Checking Secret..."

${AWS} secretsmanager describe-secret \
  --secret-id "${SECRET_NAME}" \
  --query '{Name:Name,Arn:ARN}' \
  --output table

# ============================================================
# Sample Database
# ============================================================

echo "Creating sample database schema..."

SECRET_ARN="$(
  ${AWS} secretsmanager describe-secret \
    --secret-id "${SECRET_NAME}" \
    --query 'ARN' \
    --output text
)"

CLUSTER_ARN="$(
  ${AWS} rds describe-db-clusters \
    --db-cluster-identifier "${CLUSTER_ID}" \
    --query 'DBClusters[0].DBClusterArn' \
    --output text
)"

echo "Cluster ARN: ${CLUSTER_ARN}"
echo "Secret ARN: ${SECRET_ARN}"

echo "Creating sample tables..."

${AWS} rds-data execute-statement \
  --resource-arn "${CLUSTER_ARN}" \
  --secret-arn "${SECRET_ARN}" \
  --database "appdb" \
  --sql "
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  age INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

${AWS} rds-data execute-statement \
  --resource-arn "${CLUSTER_ARN}" \
  --secret-arn "${SECRET_ARN}" \
  --database "appdb" \
  --sql "
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

${AWS} rds-data execute-statement \
  --resource-arn "${CLUSTER_ARN}" \
  --secret-arn "${SECRET_ARN}" \
  --database "appdb" \
  --sql "
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"

echo "Sample tables created."

echo "Inserting sample data..."

${AWS} rds-data execute-statement \
  --resource-arn "${CLUSTER_ARN}" \
  --secret-arn "${SECRET_ARN}" \
  --database "appdb" \
  --sql "
INSERT INTO users (name, email, age)
VALUES
  ('Alice', 'alice@example.com', 28),
  ('Bob', 'bob@example.com', 34),
  ('Charlie', 'charlie@example.com', 22);
"

${AWS} rds-data execute-statement \
  --resource-arn "${CLUSTER_ARN}" \
  --secret-arn "${SECRET_ARN}" \
  --database "appdb" \
  --sql "
INSERT INTO products (name, price, stock)
VALUES
  ('Mechanical Keyboard', 12800.00, 15),
  ('Wireless Mouse', 4800.00, 32),
  ('USB-C Hub', 6800.00, 20),
  ('27-inch Monitor', 39800.00, 8);
"

${AWS} rds-data execute-statement \
  --resource-arn "${CLUSTER_ARN}" \
  --secret-arn "${SECRET_ARN}" \
  --database "appdb" \
  --sql "
INSERT INTO orders (user_id, product_id, quantity)
VALUES
  (1, 1, 1),
  (1, 2, 2),
  (2, 4, 1),
  (3, 3, 1);
"

echo "Sample data inserted."

echo "Local RDS environment is ready."