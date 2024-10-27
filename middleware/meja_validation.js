const joi = require('joi');

const validateMeja = (req, res, next) => {

    const rules = joi.object().keys({
        nomor_meja: joi
            .string()
            .required(),
        status: joi
            .string()
            .valid(`terisi`, `kosong`)
            .required(),
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

module.exports = { validateMeja };

