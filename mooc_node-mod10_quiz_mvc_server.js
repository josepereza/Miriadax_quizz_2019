const {index} = require('./html/quizzeshtml');
const {play} = require('./html/playhtml');
const {quizForm} = require('./html/quizFormhtml');
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
//la linea de arriba equivale a :
//if (process.env.PORT){port = process.env.PORT}else{port=process.env.Port}

// Import MW for parsing POST params in BODY

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

   // Import MW supporting Method Override with express

var methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(methodOverride('_method', { methods: ['POST','GET']}));

//  ╭──────────────────────────╮
//  │          MODEL           │
//  ╰──────────────────────────╯

const Sequelize = require('sequelize');

const options = { logging: false, operatorsAliases: false};
const sequelize = new Sequelize("sqlite:db.sqlite", options);

const quizzes = sequelize.define(  // define table quizzes
    'quizzes',     
    {   question: Sequelize.STRING,
        answer: Sequelize.STRING,
        //puntuacion: Sequelize.INTEGER,
        //fecha: Sequelize.DATE
    }
);

sequelize.sync() // Syncronize DB and seed if needed
.then(() => quizzes.count())
.then((count) => {
    if (count===0) {
        return ( 
            quizzes.bulkCreate([
                { id: 1, question: "Capital of Italy",    answer: "Rome" },
                { id: 2, question: "Capital of France",   answer: "Paris" },
                { id: 3, question: "Capital of Spain",    answer: "Madrid" },
                { id: 4, question: "Capital of Portugal", answer: "Lisbon" }
            ])
            .then( c => console.log(`  DB created with ${c.length} elems`))
        )
    } else {
        return console.log(`  DB exists & has ${count} elems`);
    }
})
.catch( err => console.log(`   ${err}`));

//  ╭──────────────────────────╮
//  │       CONTROLLER         │
//  ╰──────────────────────────╯
//   indexController : coje todas las preguntas y crea la pagina de incio con ellas
//   playController:
//   checkController
//   editController
//   updateController
//   newController
//   createController
//   deleteController
//   playAjaxController
//   verRespuestaAjaxController
//   ¿que es req, res y next ? donde cojen valor.
//   lee esto : https://expressjs.com/es/guide/using-middleware.html


// GET /, GET /quizzes
const indexController = (req, res, next) => {
 
    quizzes.findAll()
    .then((quizzes) => res.send(index(quizzes)))
    .catch((error) => `DB Error:\n${error}`);
}

//  GET  /quizzes/1/play
const playController = (req, res, next) => {
    let id = Number(req.params.id);
    let response = req.query.response || "";
    console.log('response: ',response);

    quizzes.findAll({order: sequelize.random()})
    .then((quizes) => {
        nextId = quizes[0].id;
        console.log(nextId);
    })
    quizzes.findByPk(id)
    .then((quiz) => {
        res.send(play(id, quiz.question, response,nextId))
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);

 };

//  GET  /quizzes/1/check
const checkController = (req, res, next) => {
    let response = req.query.response, msg;
    let id = Number(req.params.id);

    quizzes.findByPk(id)
    .then((quiz) => {
        msg = (quiz.answer===response) ?
              `Yes, "${response}" is the ${quiz.question}` 
            : `No, "${response}" is not the ${quiz.question}`;
        return res.send(check(id, msg, response));
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);
};

//  GET /quizzes/1/edit
const editController = (req, res, next) => {
    
    let id = Number(req.params.id);
    quizzes.findByPk(id)
    .then( quiziz => {
        //const quizForm =(msg, method, action, question, answer) 
        res.send(quizForm("Edit Quiz", "post", `/quizzes/${id}/update`, quiziz.question, quiziz.answer));
    })
    .catch((error) => `Quiz not created:\n${error}`);
     // .... introducir código
};

//  PUT /quizzes/1
const updateController = (req, res, next) => {

    let id = Number(req.params.id);
    let {question, answer} = req.body;
    quizzes.findByPk(id)
        .then(
            (quiz) => {
                quiz.answer = answer;
                quiz.question = question;
                quiz.save()
                .then(
                    (quiz) => res.redirect('/quizzes')
                )
            }
        )
        .catch(i => {
            console.log(i);
        })
};

// GET /quizzes/new
const newController = (req, res, next) => {

    res.send(quizForm("Create new Quiz", "post", "/quizzes", "", ""));
 };

// POST /quizzes
const createController = (req, res, next) => {
    let {question, answer} = req.body;

    quizzes.build({question, answer})
    .save()
    .then((quiz) => res.redirect('/quizzes'))
    .catch((error) => `Quiz not created:\n${error}`);
 };

// DELETE /quizzes/1
const deleteController = (req, res, next) => {
    let id = Number(req.params.id);
    quizzes.destroy({where:{id}})
        .then(
            (quiz) => res.redirect('/quizzes')
        )
        .catch(i => {
            console.log('error');
        })
 };
 const playAjaxController = (req, res, next) => {
    
    //let response = req.query.response, msg;
    let id = Number(req.params.id);
    let response = (req.params.respuestaUser);
    quizzes.findByPk(id)
    .then((quiz) => {
        msg = (quiz.answer===response) ?
              'true'
            : `false`;
        return res.send(msg);
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);
};
const verRespuestaAjaxController = (req, res, next) => {
    
    //let response = req.query.response, msg;
    let id = Number(req.params.id);
    let response = (req.params.respuestaUser);
    quizzes.findByPk(id)
    .then((quiz) => {
        return res.send(quiz.answer);
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);
};

   // ROUTER

app.get(['/', '/quizzes'],    indexController);
app.get('/quizzes/:id/play',  playController);
app.get('/quizzes/:id/check', checkController);
app.get('/quizzes/new',       newController);
app.post('/quizzes',          createController);

    // ..... instalar los MWs asociados a
    //   GET  /quizzes/:id/edit,   PUT  /quizzes/:id y  DELETE  /quizzes/:id

app.get('/quizzes/:id/edit',   editController);
app.delete('/quizzes/:id', deleteController);
app.post('/quizzes/:id/update', updateController);
app.post('/quizzes/:id/playAjax/:respuestaUser', playAjaxController);
app.post('/quizzes/:id/verRespuesta', verRespuestaAjaxController);

app.all('*', (req, res) =>
    res.send("Error: resource not found or method not supported")
);        

   // Server started at port 8000

app.listen(port);
