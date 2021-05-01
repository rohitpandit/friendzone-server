const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const multer = require('multer');
const fs = require('fs');
const util = require('util');

//promisify the fs module functions
const mkdirAsync = util.promisify(fs.mkdir);
const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);

//multer
const storage = multer.memoryStorage();
const upload = multer({
	storage: storage,
});

router.get('/', async (req, res) => {
	try {
		console.log('GET----------------------');
		const id = req.userId;

		const user = await User.findOne({ _id: id }).select('-password');
		const { name, gender, aboutMe, country, dob } = user;

		const userInfo = { name, gender, aboutMe, country, dob };
		console.log(userInfo);

		//avtar sending logic
		if (user.avtarUrl) {
			const avtar = await readFileAsync(user.avtarUrl);
			console.log(avtar);
			userInfo[avtar] = avtar;
		}

		console.log('----------------------GET');
		res.status(200).json({ user: userInfo });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: error });
	}
});

router.put('/', upload.single('avtar'), async (req, res) => {
	try {
		console.log('PUT***********************');
		const id = req.userId;
		const { name, gender, dob, country, aboutMe } = req.body;
		const avtar = req.file;
		// console.log(avtar);

		//saving the file in the server
		if (avtar) {
			const saveDir = `./upload/${id}`;
			await mkdirAsync(saveDir, { recursive: true });
			const fileName = `${saveDir}/1.${avtar.originalname.split('.')[1]}`;
			await writeFileAsync(fileName, avtar.buffer);
		}

		const user = await User.findOne({ _id: id }).select('-password');

		if (!user) {
			res.status(400).json({ message: 'User not found!' });
			return;
		}

		if (name) {
			user.name = name;
		}
		if (gender) {
			user.gender = gender;
		}
		if (dob) {
			user.dob = dob;
		}
		if (country) {
			user.country = country;
		}
		if (aboutMe) {
			user.aboutMe = aboutMe;
		}
		if (avtar) {
			user.avtarUrl = `./upload/${id}/1.${avtar.originalname.split('.')[1]}`;
		}

		await user.save();
		console.log(user);

		console.log('*****************************PUT');

		res.status(200).json({ message: 'Data updated successfully!' });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: error });
	}
});

module.exports = router;