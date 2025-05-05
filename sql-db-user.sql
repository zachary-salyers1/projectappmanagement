-- Create a contained database user without server login
-- This approach doesn't require server admin privileges

-- Create database user with password
CREATE USER ProjectAppUser WITH PASSWORD = 'StrongP@ssword123!';

-- Grant necessary permissions
ALTER ROLE db_datareader ADD MEMBER ProjectAppUser;
ALTER ROLE db_datawriter ADD MEMBER ProjectAppUser;

-- Once created, you can use this connection string:
-- Server=tcp:salyersaipmapp.database.windows.net,1433;Initial Catalog=ProjectManageApp;Encrypt=True;TrustServerCertificate=False;User Id=ProjectAppUser;Password=StrongP@ssword123!; 