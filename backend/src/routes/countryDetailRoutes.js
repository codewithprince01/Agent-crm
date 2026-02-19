const express = require('express');
const router = express.Router();
const CountryDetailController = require('../controllers/countryDetailController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', CountryDetailController.getAllCountries);

module.exports = router;
