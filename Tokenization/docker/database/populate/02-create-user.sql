CREATE USER IF NOT EXISTS 'central-system'@'%' IDENTIFIED BY 'cern;

GRANT ALL PRIVILEGES ON `tokenization`.* TO 'central-system'@'%';

FLUSH PRIVILEGES;