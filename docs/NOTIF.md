###  MySQL setup instructions
  Run this command in your MySQL command line-
    ```sql
    CREATE TABLE `subscriptions` (
      `sub_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      `endpoint` varchar(300) DEFAULT NULL,
      `auth_key` varchar(200) DEFAULT NULL,
      `p256dh_key` varchar(200) DEFAULT NULL,
      `deviceToken` varchar(100) DEFAULT NULL,
      `preferences` varchar(20) NOT NULL DEFAULT '000'
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
    ```

## Generating the VAPID keys
You can generate a set of Private and Public VAPID keys using any of the two methods mentioned below-
  1. By using 'web-push' package from the terminal.
     ```bash
     ./node_modules/web-push/src/cli.js generate-vapid-keys
     ```
  2. By going to [Google CodeLab](https://web-push-codelab.appspot.com) (use Chrome or Mozilla, not Safari).
