-- Meant to mirror PROD InfoLogger configuration.
-- Applied once, when the database volume is first created.

CREATE DATABASE IF NOT EXISTS `INFOLOGGER` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `INFOLOGGER`;

CREATE TABLE `messages` (
  `severity` char(1) DEFAULT NULL,
  `level` tinyint(3) UNSIGNED DEFAULT NULL,
  `timestamp` double(16,6) DEFAULT NULL,
  `hostname` varchar(32) DEFAULT NULL,
  `rolename` varchar(32) DEFAULT NULL,
  `pid` mediumint(8) UNSIGNED DEFAULT NULL,
  `username` varchar(32) DEFAULT NULL,
  `system` varchar(32) DEFAULT NULL,
  `facility` varchar(32) DEFAULT NULL,
  `detector` varchar(32) DEFAULT NULL,
  `partition` varchar(32) DEFAULT NULL,
  `dest` varchar(32) DEFAULT NULL,
  `run` int(10) UNSIGNED DEFAULT NULL,
  `errcode` int(10) UNSIGNED DEFAULT NULL,
  `errline` smallint(5) UNSIGNED DEFAULT NULL,
  `errsource` varchar(32) DEFAULT NULL,
  `message` text DEFAULT NULL,
  KEY `ix_severity` (`severity`),
  KEY `ix_level` (`level`),
  KEY `ix_timestamp` (`timestamp`),
  KEY `ix_hostname` (`hostname`(14)),
  KEY `ix_rolename` (`rolename`(20)),
  KEY `ix_system` (`system`(3)),
  KEY `ix_facility` (`facility`(20)),
  KEY `ix_detector` (`detector`(8)),
  KEY `ix_partition` (`partition`(10)),
  KEY `ix_dest` (`dest`(10)),
  KEY `ix_run` (`run`),
  KEY `ix_errcode` (`errcode`),
  KEY `ix_errline` (`errline`),
  KEY `ix_errsource` (`errsource`(20))
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- We don't partition in the local DB. Partitioning by day earns its keep over a production-sized time span;
-- but causes the seeder's re-dating updates to rewrite the entire table which is slow and not ideal.
-- PARTITION BY HASH (`timestamp` DIV 86400)
-- PARTITIONS 365
