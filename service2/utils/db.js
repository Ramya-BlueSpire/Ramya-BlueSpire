const  Sequelize  = require('sequelize');
const sequelize=new Sequelize('Application','root','root',{
    host:'localhost',
    dialect:'mysql'
})
module.exports=sequelize;