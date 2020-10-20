const Joi = require('@hapi/joi')
Joi.objectId = require('joi-objectid')(Joi)

function isValid(schema, strict) {
    return function(source) {
        const { error } = schema.validate(source, { presence: strict })
        if(error) {
            return { success: false, error }
        }
        return { success: true, error: null }
    }
}

const registerSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
})
const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
})
const idSchema = Joi.object({
    _id: Joi.objectId().required(),
})

const listSchema = Joi.object({
    name: Joi.string().required(),
    public: Joi.boolean()
})
const languageSchema = Joi.object({
    text: Joi.array().items(Joi.string()).required(),
    difficulty: Joi.number(),
    streak: Joi.number(),
    reanswerTime: Joi.number(),
    lastAnswerTime: Joi.number(),
    locked: Joi.boolean(),
    wrong: Joi.boolean()
})
const questionSchema = Joi.object({
    lang1: languageSchema,
    lang2: languageSchema
})

module.exports = {
    isRegistration: isValid(registerSchema),
    isLogin: isValid(loginSchema),
    isId: isValid(idSchema),
    isList: isValid(listSchema),
    isQuestion: isValid(questionSchema, 'required')
}