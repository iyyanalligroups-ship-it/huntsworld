const mongoose = require('mongoose');
const BuyLead = require('./models/buyLeadsModel');

mongoose.connect('mongodb://localhost:27017/huntsworld').then(async () => {

    let validSearchTerms = [
        "chemical and chemical products test",
        "powdered chemical",
        "dolomite",
        "detergent powder"
    ];

    const searchRegexes = [];
    validSearchTerms.forEach(term => {
        // Create a regex that searches for the whole term anywhere in the string
        searchRegexes.push(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

        // Also break it into individual words longer than 2 characters and match those for maximum reach
        const words = term.split(/\s+/).filter(w => w.length > 2);
        words.forEach(word => {
            searchRegexes.push(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        });
    });

    const mockLead = new BuyLead({
        searchTerm: "chemical and powder",
        type: "product",
        user_id: new mongoose.Types.ObjectId()
    });
    await mockLead.save();

    const matches = await BuyLead.find({
        searchTerm: { $in: searchRegexes }
    });

    console.log("Found matches:", matches.filter(m => m.searchTerm === 'chemical and powder').length);

    process.exit();
});
