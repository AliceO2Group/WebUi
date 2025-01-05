-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: mariadb
-- Generation Time: Dec 15, 2024 at 02:28 PM
-- Server version: 11.5.2-MariaDB-ubu2404
-- PHP Version: 8.2.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `INFOLOGGER`
--
CREATE DATABASE IF NOT EXISTS `INFOLOGGER` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
USE `INFOLOGGER`;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `severity` char(1) DEFAULT NULL,
  `level` tinyint(3) UNSIGNED DEFAULT NULL,
  `timestamp` double(16,6) DEFAULT NULL,
  `hostname` varchar(32) DEFAULT NULL,
  `rolename` varchar(32) DEFAULT NULL,
  `pid` smallint(5) UNSIGNED DEFAULT NULL,
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
  `message` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci
PARTITION BY HASH (`timestamp` DIV 86400)
PARTITIONS 365;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`severity`, `level`, `timestamp`, `hostname`, `rolename`, `pid`, `username`, `system`, `facility`, `detector`, `partition`, `dest`, `run`, `errcode`, `errline`, `errsource`, `message`) VALUES
('I', 6, 1456134840.001504, 'aldaqecs01-v1', NULL, 2733, 'alicedaq', 'DAQ', 'LHCBeamInfo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Mon Feb 22 10:54:00 2016 (1456134840): BeamMode: NO BEAM; BeamType: ; ParticleTypeB1: ; ParticleTypeB2: ; BetaStar: ; Eng: 0 GeV; FillN: -999; FillScheme: ; NbunchesInt: 0; NbunchesNotIntB1: 0; NbunchesNotIntB2: 0; InteracIst I(B1): 0; InteracTot I(B1): 0; InteracIst I(B2): 0; InteracTot I(B2): 0; NotInteracIst I(B1): 0; NotInteracTot I(B1): 0; NotInteracIst I(B2): 0; NotInteracTot I(B2): 0; PostMortemN: 1; LHCAdjust: STANDBY; LHCBeamDump: STANDBY; LHCInjection: STANDBY; DIPconnected Flag: 1 1 1 1 1 1 1 1 1 1 1 1 1 1');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD KEY `ix_severity` (`severity`),
  ADD KEY `ix_level` (`level`),
  ADD KEY `ix_timestamp` (`timestamp`),
  ADD KEY `ix_hostname` (`hostname`(14)),
  ADD KEY `ix_rolename` (`rolename`(20)),
  ADD KEY `ix_system` (`system`(3)),
  ADD KEY `ix_facility` (`facility`(20)),
  ADD KEY `ix_detector` (`detector`(8)),
  ADD KEY `ix_partition` (`partition`(10)),
  ADD KEY `ix_dest` (`dest`(10)),
  ADD KEY `ix_run` (`run`),
  ADD KEY `ix_errcode` (`errcode`),
  ADD KEY `ix_errline` (`errline`),
  ADD KEY `ix_errsource` (`errsource`(20));
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
