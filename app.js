const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();
const mysql = require("mysql");


app.use(bodyParser.urlencoded({ extended: true }));


const connection = mysql.createConnection({
    host: "localhost", // Your MySQL host (change this accordingly)
    user: "root", // Your MySQL username
    password: "", // Your MySQL password
    database: "blog-website" // Your MySQL database name
});


connection.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL: " + err.stack);
        return;
    }
    console.log("Connected to MySQL as ID " + connection.threadId);
});



app.post("/admin/panel/post", (req, res) => {
    const { title, description } = req.body;

    const blogPost = { title, description };

    connection.query("INSERT INTO blog SET ?", blogPost, (err, result) => {
        if (err) {
            console.error("Error adding blog post: " + err.stack);
            res.status(500).send("Error adding blog post");
            return;
        }
        console.log("Blog post added successfully");
        res.redirect("/admin/home"); // Redirect back to the homepage or desired location
    });
});




app.get("/blogs", (req, res) => {
    connection.query("SELECT id,title, description FROM blog", (err, rows) => {
        if (err) {
            console.error("Error retrieving blogs: " + err.stack);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.json(rows); // Sending the retrieved data as JSON response
    });
});



const users = [
    { username: 'siddhesh', password: 'admin' },
    { username: 'user2', password: 'password2' },
    { username: 'user3', password: 'password3' }
];


app.use(session({
    secret: 'secret-key', // Change this to a more secure secret in a production environment
    resave: false,
    saveUninitialized: true
}));



app.get("/admin/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.sendStatus(500);
        } else {
            res.redirect("/admin/login");
        }
    });
});




const authenticateAdmin = (req, res, next) => {
    if (req.session && req.session.user) {
        next(); // If session exists, proceed to the next middleware or route handler
    } else {
        res.status(401).send('Unauthorized'); // Send 401 status for unauthorized access
    }
};




// ...

// Function to handle blog deletion
// Assuming you already have established a MySQL connection named 'connection'

app.delete("/admin/deleteBlog/:id", authenticateAdmin, (req, res) => {
    const blogId = req.params.id;
    console.log(blogId)
    // Perform a DELETE query to remove the blog post with the specified ID
    const deleteQuery = "DELETE FROM blog WHERE id = ?";
    connection.query(deleteQuery, [blogId], (err, result) => {
        if (err) {
            console.error("Error deleting blog:", err);
            res.status(500).send("Error deleting blog");
            return;
        }

        // If the blog was deleted successfully, send a success message
        console.log(`Deleted blog with ID: ${blogId}`);
        res.status(200).send("Blog deleted successfully");
    });
});


// app.get("/admin/home", authenticateAdmin, (req, res) => {
//     // Fetch blog posts from the database
//     connection.query("SELECT * FROM blog", (err, rows) => {
//         if (err) {
//             console.error("Error retrieving blogs: " + err.stack);
//             res.status(500).send("Internal Server Error");
//             return;
//         }

//         // Send the blog data to the admin-home.html file to render
//         res.render("admin-home", { blogs: rows });
//     });
// });

// The rest of your code remains unchanged...







app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});


app.get("/admin/home", authenticateAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "/admin-home.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "/about.html"));
});

app.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirname, "/contact.html"));
});


app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;

    const matchedUser = users.find(user => user.username === username && user.password === password);

    if (matchedUser) {
        req.session.user = username; // Store username in session upon successful login
        res.redirect("/admin/panel");
    } else {
        res.send('Invalid credentials. Please try again.');
    }
});

app.get("/admin/panel", authenticateAdmin, (req, res) => {
    // This route is protected by authentication middleware using sessions
    res.sendFile(path.join(__dirname, "/admin-panel.html"));
});

app.get("/admin/login", (req, res) => {
    res.sendFile(path.join(__dirname, "admin-login.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
