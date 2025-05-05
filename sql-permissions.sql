-- Try with various formats for the managed identity name

-- Option 1: Using the specific Object ID from error message
CREATE USER [f30f4013-fa97-4ed4-8de4-aa6e9433d706] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [f30f4013-fa97-4ed4-8de4-aa6e9433d706];
ALTER ROLE db_datawriter ADD MEMBER [f30f4013-fa97-4ed4-8de4-aa6e9433d706];

-- Option 2: App name
/*
CREATE USER [salyersaipmapp] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [salyersaipmapp];
ALTER ROLE db_datawriter ADD MEMBER [salyersaipmapp];
*/

-- Option 3: Static Web App hostname
/*
CREATE USER [victorious-field-05d13d20f] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [victorious-field-05d13d20f];
ALTER ROLE db_datawriter ADD MEMBER [victorious-field-05d13d20f];
*/

-- Option 4: Try with tenant ID
/*
CREATE USER [854e713d-2b19-4c53-be6b-d7ff55e01534] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [854e713d-2b19-4c53-be6b-d7ff55e01534];
ALTER ROLE db_datawriter ADD MEMBER [854e713d-2b19-4c53-be6b-d7ff55e01534];
*/

-- Option 5: Try with spn_ prefix (common for service principals)
/*
CREATE USER [spn_salyersaipmapp] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [spn_salyersaipmapp];
ALTER ROLE db_datawriter ADD MEMBER [spn_salyersaipmapp];
*/

-- Option 6: Try with object ID directly from portal 
-- (Go to Static Web App > Identity > System Assigned > Copy Object ID)
/*
-- Replace with your object ID
DECLARE @ObjectID NVARCHAR(128) = 'YOUR-MANAGED-IDENTITY-OBJECT-ID';
DECLARE @sql NVARCHAR(MAX) = 
    'CREATE USER [' + @ObjectID + '] FROM EXTERNAL PROVIDER;' + 
    'ALTER ROLE db_datareader ADD MEMBER [' + @ObjectID + '];' + 
    'ALTER ROLE db_datawriter ADD MEMBER [' + @ObjectID + '];';
EXEC sp_executesql @sql;
*/ 