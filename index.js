const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken'); // Import JWT library


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'student',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});
app.post('/create-token', (req, res) => {
  const { name, surname, 	stdNumber } = req.body;

  // Query to check if the user exists in the database
  const query = 'SELECT * FROM students WHERE name = ? AND surname = ? AND stdNumber = ?';
  db.query(query, [name, surname, stdNumber], (err, results) => {
    if (err) {
      // Handle database error
      console.error('Database error:', err);
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }

    if (results.length > 0) {
      // If authentication succeeds, create and return a JWT token
      const token = jwt.sign({ name, surname, stdNumber }, 'your_secret_key', { expiresIn: '1h' });
      res.json({ token });
    } else {
      // If user not found in the database, return a message
      res.status(401).json({ message: 'User not found' });
    }
  });
});





app.post('/average-grade', (req, res) => {
  const { name, surname, stdNumber, courseCode } = req.body;

  // SQL query to calculate average grade for the specified course of the student
  const query = `
    SELECT 
        AVG(sg.value) AS average_grade
    FROM 
        students s
    INNER JOIN 
        studentgrades sg ON s.stdNumber = sg.number
    WHERE 
        s.name = ? AND s.surname = ? AND s.stdNumber = ? AND sg.code = ?;
  `;

  // Execute the query
  db.query(query, [name, surname, stdNumber, courseCode], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    
    if (results.length === 0 || !results[0].average_grade) {
      return res.status(404).json({ message: 'No grades found for the specified course for the student' });
    }

    // Prepare the response with average grade
    const averageGrade = {
      course_code: courseCode,
      average_grade: results[0].average_grade
    };

    res.json(averageGrade);
  });
});


app.get('/grades/:stdNumber', (req, res) => {
  const stdNumber = req.params.stdNumber;

  // Query to select student information and grades for the student with given student number
  const query = `
    SELECT students.name, students.surname, students.stdnumber, studentgrades.code, studentgrades.value
    FROM students
    INNER JOIN studentgrades ON students.stdnumber = studentgrades.number
    WHERE students.stdnumber = ?`;

  db.query(query, [stdNumber], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Student information
    const studentInfo = {
      name: results[0].name,
      surname: results[0].surname,
      stdNumber: results[0].stdnumber,
      grades: []
    };

    // Convert the results to the desired format
    results.forEach(row => {
      studentInfo.grades.push({
        code: row.code,
        value: row.value
      });
    });

    res.json(studentInfo);
  });
});




// GET endpoint for fetching users
app.get('/users', (req, res) => {
  // Query to select all users from the database
  db.query('SELECT * FROM students', (err, results) => {
    if (err) throw err;
    // Return the results as JSON response
    res.json(results);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});