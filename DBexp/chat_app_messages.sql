-- MySQL dump 10.13  Distrib 8.0.32, for macos13 (x86_64)
--
-- Host: 127.0.0.1    Database: chat_app
-- ------------------------------------------------------
-- Server version	8.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int DEFAULT NULL,
  `receiver_id` int DEFAULT NULL,
  `content` text,
  `content_type` enum('text','image','video','file') DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (35,10,9,'hi1','text',NULL,'2024-11-07 05:58:31',NULL),(36,NULL,NULL,NULL,NULL,NULL,'2024-11-07 06:15:33',NULL),(37,10,9,'gm','text',NULL,'2024-11-07 06:16:07',NULL),(38,NULL,NULL,NULL,NULL,NULL,'2024-11-07 06:25:13',NULL),(39,10,9,'test2','text',NULL,'2024-11-07 06:26:33',NULL),(40,10,9,'old test','text',NULL,'2024-11-07 06:34:45',NULL),(41,10,9,'hh','text',NULL,'2024-11-07 06:58:26',NULL),(42,10,9,'ff','text',NULL,'2024-11-07 06:58:54',NULL),(43,10,9,'test3','text',NULL,'2024-11-07 07:05:21',NULL),(44,9,10,'hey jaanu','text',NULL,'2024-11-07 07:08:37',NULL),(45,10,9,'hey','text',NULL,'2024-11-07 07:08:48',NULL),(46,9,10,'From Android','text',NULL,'2024-11-07 17:27:06',NULL),(47,10,9,'test android','text',NULL,'2024-11-15 06:33:28',NULL),(48,9,10,'Hey from Android','text',NULL,'2024-11-15 06:36:00',NULL),(49,9,10,'hey','text',NULL,'2024-11-15 06:40:54',NULL),(50,9,10,'1','text',NULL,'2024-11-15 06:59:00',NULL),(51,10,9,'2','text',NULL,'2024-11-15 06:59:06',NULL),(52,9,10,'3','text',NULL,'2024-11-15 07:28:02',NULL),(53,9,10,'4','text',NULL,'2024-11-15 07:44:20',NULL),(54,10,9,'5','text',NULL,'2024-11-15 07:44:47',NULL),(55,9,10,'6','text',NULL,'2024-11-15 07:51:18',NULL),(56,10,9,'7','text',NULL,'2024-11-15 07:54:09',NULL),(57,9,10,'8','text',NULL,'2024-11-15 07:56:14',NULL),(58,10,9,'9','text',NULL,'2024-11-15 08:02:50',NULL),(59,9,10,'10','text',NULL,'2024-11-15 08:03:09',NULL),(60,10,9,'new test 1','text',NULL,'2024-12-10 07:16:54',NULL),(61,9,10,'hi','text',NULL,'2024-12-12 17:19:26',NULL),(62,10,9,'hii','text',NULL,'2024-12-12 17:20:22',NULL),(63,10,9,'new1','text',NULL,'2024-12-14 09:38:13',NULL),(64,9,10,'hii33','text',NULL,'2024-12-14 09:38:56',NULL),(65,9,10,'neeeeww','text',NULL,'2024-12-14 09:45:28',NULL),(66,10,9,'ff','text',NULL,'2024-12-14 09:46:02',NULL),(67,10,9,'hiiiii2','text',NULL,'2024-12-14 10:29:49',NULL),(68,9,10,'rr','text',NULL,'2024-12-14 10:45:12',NULL),(69,10,9,'ee','text',NULL,'2024-12-14 10:45:53',NULL),(70,10,9,'yes','text',NULL,'2024-12-14 12:19:26',NULL),(71,9,10,'not','text',NULL,'2024-12-14 12:21:53',NULL),(72,10,9,'fr','text',NULL,'2024-12-14 12:23:41',NULL),(73,9,10,'rr','text',NULL,'2024-12-14 12:23:50',NULL),(74,10,9,'hh','text',NULL,'2024-12-14 12:31:24',NULL),(75,9,10,'rw','text',NULL,'2024-12-14 12:31:32',NULL),(76,9,10,'owe','text',NULL,'2024-12-15 05:28:18',NULL),(77,9,10,'yes1','text',NULL,'2024-12-15 05:30:53',NULL),(78,9,10,'rew','text',NULL,'2024-12-15 05:45:54',NULL),(79,9,10,'ewde','text',NULL,'2024-12-15 05:47:25',NULL),(80,9,10,'ewe','text',NULL,'2024-12-15 05:47:34',NULL),(81,9,10,'sss','text',NULL,'2024-12-15 05:47:51',NULL),(82,10,9,'sfsdf','text',NULL,'2024-12-15 05:47:59',NULL),(83,10,9,'hy','text',NULL,'2024-12-15 05:59:31',NULL),(84,9,10,'hey','text',NULL,'2024-12-15 05:59:42',NULL),(85,10,9,'f','text',NULL,'2024-12-15 06:05:39',NULL),(86,10,9,'ddd','text',NULL,'2024-12-15 13:58:36',NULL),(87,10,9,'wewew','text',NULL,'2024-12-15 14:13:37',NULL),(88,10,9,'heyy','text',NULL,'2024-12-15 14:21:10',NULL),(89,10,9,'we','text',NULL,'2024-12-15 14:57:06',NULL),(90,10,9,'ge','text',NULL,'2024-12-15 15:02:49',NULL),(91,10,9,'r','text',NULL,'2024-12-15 15:09:20',NULL),(92,9,10,'rr','text',NULL,'2024-12-15 15:10:07',NULL),(93,10,9,'wewe','text',NULL,'2024-12-15 15:14:05',NULL),(94,10,9,'old test','text',NULL,'2024-12-15 15:22:25',NULL),(95,10,9,'ff','text',NULL,'2024-12-15 15:23:08',NULL),(96,9,10,'r','text',NULL,'2024-12-15 15:23:21',NULL),(97,9,10,'hh','text',NULL,'2024-12-15 15:27:14',NULL),(98,10,9,'ff','text',NULL,'2024-12-15 15:27:21',NULL),(99,10,9,'fr','text',NULL,'2024-12-15 15:35:02',NULL),(100,10,9,'tes1','text',NULL,'2024-12-15 15:35:56',NULL),(101,9,10,'test2','text',NULL,'2024-12-15 15:36:03',NULL),(102,10,9,'old test','text',NULL,'2024-12-15 15:37:20',NULL),(103,9,10,'hh','text',NULL,'2024-12-15 15:38:37',NULL),(104,10,9,'hhrr','text',NULL,'2024-12-15 15:46:33',NULL),(105,10,9,'fr','text',NULL,'2024-12-15 16:05:34',NULL),(106,10,9,'121','text',NULL,'2024-12-15 16:09:15',NULL),(107,10,9,'old test','text',NULL,'2024-12-15 16:11:24',NULL),(108,10,9,'hi','text',NULL,'2024-12-15 16:35:38',NULL),(109,10,9,'bug fic 1','text',NULL,'2024-12-15 16:37:01',NULL),(110,10,9,'ff','text',NULL,'2024-12-15 16:38:20',NULL),(111,10,9,'bug fic 1','text',NULL,'2024-12-15 16:45:21',NULL),(112,9,10,'hi','text',NULL,'2024-12-15 16:48:33',NULL),(113,9,10,'ff','text',NULL,'2024-12-15 16:56:48',NULL),(114,10,9,'ff','text',NULL,'2024-12-15 17:01:01',NULL),(115,9,10,'old test','text',NULL,'2024-12-15 17:02:37',NULL),(116,9,10,'ff','text',NULL,'2024-12-16 07:54:30',NULL),(117,10,9,'hh','text',NULL,'2024-12-26 14:21:39',NULL),(118,10,9,'done load more','text',NULL,'2024-12-26 14:37:03',NULL),(119,9,10,'ok','text',NULL,'2024-12-26 14:37:20',NULL),(120,10,9,'cc','text',NULL,'2025-01-06 07:33:24',NULL),(121,9,10,'hi','text',NULL,'2025-01-06 09:03:11',NULL);
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-06 18:53:44
