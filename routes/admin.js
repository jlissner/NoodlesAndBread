const express        = require('express');
const pickTable      = require('../modules/pickTable');
const sendEmail      = require('../modules/sendEmail');
const router         = express.Router();

// admin
router.get('/', (req, res) => {
	res.render('admin', {
		users: pickTable('Users').cached(),
	});
});

router.post('/clear-cache/:table', (req, res) => {
	const table = pickTable(req.params.table);

	if(!table) {
		console.error('Please choose a table.');
		res.status(500).send('Please choose a table.');
	}

	table.updateCache().then(() => {
		res.send('success');
	});
});

module.exports = router;