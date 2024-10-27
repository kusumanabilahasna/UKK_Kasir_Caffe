const joi = require('joi');

const validateUser = (req, res, next) => {

    const rules = joi.object({
        nama_user: joi
            .string()
            .required(),
        role: joi
            .string()
            .valid(`kasir`, `admin`, `manajer`)
            .required(),
        username: joi
            .string()
            .required(),
        password: joi
            .string()
            .min(8)
            .required()
    })
    .options({ abortEarly: false});
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

module.exports = { validateUser };

