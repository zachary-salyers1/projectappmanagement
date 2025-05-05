-- Check if Projects table exists and create it if not
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
BEGIN
    -- Create Projects table
    CREATE TABLE Projects (
      ProjectId INT IDENTITY(1,1) PRIMARY KEY,
      Name NVARCHAR(100) NOT NULL,
      Description NVARCHAR(500) NULL,
      StartDate DATETIME NULL,
      DueDate DATETIME NULL,
      Status NVARCHAR(50) NOT NULL DEFAULT 'Not Started', -- Not Started, In Progress, Completed, On Hold
      Priority INT NOT NULL DEFAULT 2, -- 1=High, 2=Medium, 3=Low
      Owner NVARCHAR(100) NULL,
      CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
      UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    
    PRINT 'Projects table created';
END
ELSE
BEGIN
    PRINT 'Projects table already exists';
END

-- Check if Tasks table exists and create it if not
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tasks')
BEGIN
    -- Create Tasks table
    CREATE TABLE Tasks (
      TaskId INT IDENTITY(1,1) PRIMARY KEY,
      ProjectId INT NOT NULL FOREIGN KEY REFERENCES Projects(ProjectId) ON DELETE CASCADE,
      Title NVARCHAR(200) NOT NULL,
      Description NVARCHAR(1000) NULL,
      Status NVARCHAR(50) NOT NULL DEFAULT 'To Do', -- To Do, In Progress, Completed, Blocked
      Priority INT NOT NULL DEFAULT 2, -- 1=High, 2=Medium, 3=Low
      AssignedTo NVARCHAR(100) NULL,
      DueDate DATETIME NULL,
      CompletedDate DATETIME NULL,
      CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
      UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    
    PRINT 'Tasks table created';
END
ELSE
BEGIN
    PRINT 'Tasks table already exists';
END

-- Check if CreateProject stored procedure exists and create it if not
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'CreateProject')
BEGIN
    EXEC('
    CREATE PROCEDURE CreateProject
      @Name NVARCHAR(100),
      @Description NVARCHAR(500) = NULL,
      @StartDate DATETIME = NULL,
      @DueDate DATETIME = NULL,
      @Status NVARCHAR(50) = ''Not Started'',
      @Priority INT = 2,
      @Owner NVARCHAR(100) = NULL
    AS
    BEGIN
      INSERT INTO Projects (Name, Description, StartDate, DueDate, Status, Priority, Owner)
      VALUES (@Name, @Description, @StartDate, @DueDate, @Status, @Priority, @Owner);
      
      SELECT SCOPE_IDENTITY() AS ProjectId;
    END
    ');
    
    PRINT 'CreateProject stored procedure created';
END
ELSE
BEGIN
    PRINT 'CreateProject stored procedure already exists';
END

-- Check if UpdateProject stored procedure exists and create it if not
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'UpdateProject')
BEGIN
    EXEC('
    CREATE PROCEDURE UpdateProject
      @ProjectId INT,
      @Name NVARCHAR(100),
      @Description NVARCHAR(500) = NULL,
      @StartDate DATETIME = NULL,
      @DueDate DATETIME = NULL,
      @Status NVARCHAR(50) = NULL,
      @Priority INT = NULL,
      @Owner NVARCHAR(100) = NULL
    AS
    BEGIN
      UPDATE Projects
      SET 
        Name = @Name,
        Description = @Description,
        StartDate = @StartDate,
        DueDate = @DueDate,
        Status = ISNULL(@Status, Status),
        Priority = ISNULL(@Priority, Priority),
        Owner = @Owner,
        UpdatedAt = GETDATE()
      WHERE ProjectId = @ProjectId;
      
      SELECT * FROM Projects WHERE ProjectId = @ProjectId;
    END
    ');
    
    PRINT 'UpdateProject stored procedure created';
END
ELSE
BEGIN
    PRINT 'UpdateProject stored procedure already exists';
END

-- Check if CreateTask stored procedure exists and create it if not
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'CreateTask')
BEGIN
    EXEC('
    CREATE PROCEDURE CreateTask
      @ProjectId INT,
      @Title NVARCHAR(200),
      @Description NVARCHAR(1000) = NULL,
      @Status NVARCHAR(50) = ''To Do'',
      @Priority INT = 2,
      @AssignedTo NVARCHAR(100) = NULL,
      @DueDate DATETIME = NULL
    AS
    BEGIN
      INSERT INTO Tasks (ProjectId, Title, Description, Status, Priority, AssignedTo, DueDate)
      VALUES (@ProjectId, @Title, @Description, @Status, @Priority, @AssignedTo, @DueDate);
      
      SELECT SCOPE_IDENTITY() AS TaskId;
    END
    ');
    
    PRINT 'CreateTask stored procedure created';
END
ELSE
BEGIN
    PRINT 'CreateTask stored procedure already exists';
END

-- Check if UpdateTask stored procedure exists and create it if not
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'UpdateTask')
BEGIN
    EXEC('
    CREATE PROCEDURE UpdateTask
      @TaskId INT,
      @Title NVARCHAR(200) = NULL,
      @Description NVARCHAR(1000) = NULL,
      @Status NVARCHAR(50) = NULL,
      @Priority INT = NULL,
      @AssignedTo NVARCHAR(100) = NULL,
      @DueDate DATETIME = NULL,
      @CompletedDate DATETIME = NULL
    AS
    BEGIN
      UPDATE Tasks
      SET 
        Title = ISNULL(@Title, Title),
        Description = @Description, -- Allow NULL for description
        Status = ISNULL(@Status, Status),
        Priority = ISNULL(@Priority, Priority),
        AssignedTo = @AssignedTo, -- Allow NULL for AssignedTo
        DueDate = @DueDate, -- Allow NULL for DueDate
        CompletedDate = @CompletedDate, -- Allow NULL for CompletedDate
        UpdatedAt = GETDATE()
      WHERE TaskId = @TaskId;
      
      SELECT * FROM Tasks WHERE TaskId = @TaskId;
    END
    ');
    
    PRINT 'UpdateTask stored procedure created';
END
ELSE
BEGIN
    PRINT 'UpdateTask stored procedure already exists';
END 