@echo off
echo Importando base de datos GLPI...
echo.
echo Asegurate de que XAMPP MySQL este corriendo!
echo.
set /p dbfile="Arrastra tu archivo .sql aqui y presiona Enter: "
echo.
echo Importando...
"C:\xampp\mysql\bin\mysql.exe" -u root -p glpi < %dbfile%
echo.
echo Importacion completada!
pause
