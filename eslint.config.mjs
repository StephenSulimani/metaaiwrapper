// @ts-check

import eslint from '@eslint/js'
import tselint from 'typescript-eslint'

export default tselint.config(
    eslint.configs.recommended,
    ...tselint.configs.recommended,
)