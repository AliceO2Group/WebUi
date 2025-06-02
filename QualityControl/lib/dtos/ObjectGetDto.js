import Joi from 'joi';

export const RUN_TYPES = ['PHYSICS', 'PROTON-PROTON', '0', '1', '2'];
const periodNamePattern = /^LHC\d{1,2}[a-z]+$/i;

const filterValidators = {
  RunNumber: (number) => Number.isInteger(number) && number >= 0 && number < 1000000, // Upper bound subject to change
  RunType: (type) => RUN_TYPES.includes(type),
  PeriodName: (periodName) => periodNamePattern.test(periodName),
  PassName: (name) => name, // I don't know what the pattern is of PassNames. They don't show up in 'latest' API calls.
};

const validateFilters = (value, helpers) => {
  for (const [key, val] of Object.entries(value)) {
    const validator = filterValidators[key];

    if (!validator) {
      return helpers.error('filters.unknownField', { field: key });
    }

    if (!validator(val)) {
      return helpers.error(`filters.${key}.invalid`);
    }
  }
  return value;
};

const filters = Joi.object()
  .optional()
  .custom(validateFilters)
  .messages({
    'filters.RunNumber.invalid': 'RunNumber must be a number between 0 and 999999',
    'filters.RunType.invalid': `RunType must be one of: ${RUN_TYPES.join(', ')}`,
    'filters.PeriodName.invalid': 'PeriodName must match pattern LHC followed by 1-2 digits and letters',
    'filters.unknownField': 'Unknown filter field: {{#field}}',
  });

const baseObjectGetDto = Joi.object({ // Singular
  token: Joi.string().required(),
  id: Joi.string().optional(),
  validFrom: Joi.number().optional().min(0),
  filters,
}).options({ allowUnknown: false });

const baseObjectsGetDto = Joi.object({ // Plural
  token: Joi.string().required(),
  fields: Joi.array().default([]).items(Joi.string()),
  filters,
}).options({ allowUnknown: false });

export const ObjectsGetDto = baseObjectsGetDto.keys({ prefix: Joi.string() });
export const ObjectContentsGetDto = baseObjectGetDto.keys({ path: Joi.string().required() });
export const ObjectGetByIdDto = baseObjectGetDto.keys({ id: Joi.string().optional() });

export const qcgIdDto = Joi.string().required().trim().min(1).messages({
  'string.empty': 'Missing object ID in URL',
});
