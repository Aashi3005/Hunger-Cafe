const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aashi01kothari@gmail.com',
    pass: 'bkdp vxvf htnq xbeu',
  },
});

const sendRecipeEmail = async (req, res) => {
  try {
    const { recipe, toEmail } = req.body;

    if (!recipe || !toEmail) {
      return res.status(400).json({ success: false, message: 'Missing recipe or recipient email.' });
    }

    if (!recipe.ingredients?.length || !recipe.instructions?.length) {
      return res.status(400).json({
        success: false,
        message: 'Recipe must have ingredients and instructions.',
      });
    }

    // 🛠️ Compose email body
    let body = `🍽️ ${recipe.title}\n\n`;
    body += `Description: ${recipe.description}\n\n`;
    body += `Ingredients:\n`;
    recipe.ingredients.forEach((ingredient) => {
      body += `- ${ingredient.name} ${ingredient.quantity || ''}\n`;
    });
    body += `\nInstructions:\n`;
    recipe.instructions.forEach((step, idx) => {
      body += `${idx + 1}. ${step.description || step}\n`;
    });

    const mailOptions = {
      from: 'aashi01kothari@gmail.com',
      to: toEmail,
      subject: `Check out this recipe: ${recipe.title}`,
      text: body,
    };

    console.log(`📤 Sending recipe "${recipe.title}" to ${toEmail}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Email send error:', err);
    res.status(500).json({ success: false, message: err.message || 'Unknown error' });
  }
};

module.exports = sendRecipeEmail;
