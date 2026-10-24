import pymysql
import sys

def setup_mysql_database():
    host = "localhost"
    port = 3306
    user = "root"
    password = "dinesh@19052008"
    db_name = "smart_attendance_db"

    print(f"Connecting to MySQL server at {host}:{port} as {user}...")
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            charset="utf8mb4",
            autocommit=True
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"Schema `{db_name}` successfully created / verified!")
            cursor.execute("SHOW DATABASES LIKE 'smart_attendance_db';")
            result = cursor.fetchall()
            print(f"Verification result: {result}")
        conn.close()
        print("MySQL connection and schema setup completed successfully!")
        return True
    except Exception as e:
        print(f"Error connecting or setting up MySQL schema: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = setup_mysql_database()
    sys.exit(0 if success else 1)
