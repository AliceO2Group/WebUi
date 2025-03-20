CREATE USER 'cern'@'%' IDENTIFIED BY 'cern';

GRANT ALL PRIVILEGES ON qcg.* TO 'cern'@'%' ;
GRANT ALL PRIVILEGES ON qcg_test.* TO 'cern'@'%' ;
