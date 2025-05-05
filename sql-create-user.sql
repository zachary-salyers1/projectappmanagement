-- Create a traditional SQL Server authentication user for testing
-- This is a temporary solution to test database connectivity without managed identity

-- Create login at server level
CREATE LOGIN ProjectAppUser WITH PASSWORD = 'StrongP@ssword123!';

-- Create user in the database mapped to the login
USE ProjectManageApp;
CREATE USER ProjectAppUser FOR LOGIN ProjectAppUser;

-- Grant needed permissions
ALTER ROLE db_datareader ADD MEMBER ProjectAppUser;
ALTER ROLE db_datawriter ADD MEMBER ProjectAppUser;

-- Test query to validate permissions
-- EXECUTE AS USER = 'ProjectAppUser';
-- SELECT 'Success' AS Status;
-- REVERT;

-- Once created, you can use this connection string:
-- Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;User Id=ProjectAppUser;Password=StrongP@ssword123!; 