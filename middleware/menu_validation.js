const joi = require('joi');


const validateMenu = (req, res, next) => {
    console.log("Request body:", req.body);
    const rules = joi.object({
        nama_menu: joi
            .string()
            .required(),
        jenis: joi
            .string()
            .valid(`makanan`, `minuman`)
            .required(),
        deskripsi: joi
            .string()
            .required(),
        harga: joi
            .number()
            .required()
    })
    .options({ abortEarly: false})
    const { error } = rules.validate(req.body);

    if (error != null) {
        let errMessage = error
            .details
            .map(it => it.message)
            .join(",")
        return res.status(422).json ({
            success : false,
            message: errMessage
        })
    }

    next();
};

module.exports = { validateMenu };

