CREATE USER IF NOT EXISTS 'central-system'@'%' IDENTIFIED BY 'super_secret_password_for_dev_purposes_only';

GRANT ALL PRIVILEGES ON `tokenization`.* TO 'central-system'@'%';

FLUSH PRIVILEGES;