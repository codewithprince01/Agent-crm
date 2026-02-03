require('dotenv').config();
const { User } = require('./src/models');

async function debugUser() {
    try {
        const email = 'admin1@gmail.com';
        console.log(`Searching for user: ${email}`);

        const user = await User.findOne({ where: { email } });

        if (user) {
            console.log('User found:');
            console.log(JSON.stringify(user.toJSON(), null, 2));
        } else {
            console.log('User NOT found.');
        }
    } catch (error) {
        console.error('Error searching for user:', error);
    } finally {
        process.exit();
    }
}

debugUser();
