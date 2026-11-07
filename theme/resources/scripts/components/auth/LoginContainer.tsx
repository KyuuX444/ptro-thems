import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers, Field as FormikField, FieldProps } from 'formik';
import { object, string } from 'yup';
import tw from 'twin.macro';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);
                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);
                setToken('');
                if (ref.current) ref.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, submitForm }) => (
                <LoginFormContainer
                    title={'Welcome Back'}
                    subtitle={'Login to your account to continue'}
                >
                                        <FormikField name={'username'}>
                        {({ field, form: { touched, errors } }: FieldProps) => (
                            <div css={tw`mb-4`}>
                                <label
                                    htmlFor={'username'}
                                    css={tw`block text-xs font-medium text-neutral-300 mb-1.5`}
                                >
                                    Email Address
                                </label>
                                <div css={tw`relative`}>
                                    <div
                                        css={tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 text-xs`}
                                    >
                                        <FontAwesomeIcon icon={faEnvelope} />
                                    </div>
                                    <input
                                        id={'username'}
                                        type={'text'}
                                        autoComplete={'username'}
                                        placeholder={'admin@example.com'}
                                        disabled={isSubmitting}
                                        {...field}
                                        css={[
                                            tw`w-full bg-[#131316] text-neutral-100 placeholder-neutral-500 text-sm rounded-lg pl-9 pr-3 py-2.5 border transition-all duration-150 outline-none`,
                                            touched.username && errors.username
                                                ? tw`border-red-500/80 focus:border-red-400 focus:ring-1 focus:ring-red-400`
                                                : tw`border-neutral-800 hover:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400`,
                                        ]}
                                    />
                                </div>
                                {touched.username && errors.username && (
                                    <p css={tw`text-xs text-red-400 mt-1.5`}>{errors.username as string}</p>
                                )}
                            </div>
                        )}
                    </FormikField>

                                        <FormikField name={'password'}>
                        {({ field, form: { touched, errors } }: FieldProps) => (
                            <div css={tw`mb-5`}>
                                <label
                                    htmlFor={'password'}
                                    css={tw`block text-xs font-medium text-neutral-300 mb-1.5`}
                                >
                                    Password
                                </label>
                                <div css={tw`relative`}>
                                    <div
                                        css={tw`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500 text-xs`}
                                    >
                                        <FontAwesomeIcon icon={faLock} />
                                    </div>
                                    <input
                                        id={'password'}
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete={'current-password'}
                                        placeholder={'••••••••••••'}
                                        disabled={isSubmitting}
                                        {...field}
                                        css={[
                                            tw`w-full bg-[#131316] text-neutral-100 placeholder-neutral-500 text-sm rounded-lg pl-9 pr-10 py-2.5 border transition-all duration-150 outline-none font-mono`,
                                            touched.password && errors.password
                                                ? tw`border-red-500/80 focus:border-red-400 focus:ring-1 focus:ring-red-400`
                                                : tw`border-neutral-800 hover:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400`,
                                        ]}
                                    />
                                    <button
                                        type={'button'}
                                        onClick={() => setShowPassword(!showPassword)}
                                        css={tw`absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 text-xs transition-colors focus:outline-none cursor-pointer`}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                                    </button>
                                </div>
                                {touched.password && errors.password && (
                                    <p css={tw`text-xs text-red-400 mt-1.5`}>{errors.password as string}</p>
                                )}
                            </div>
                        )}
                    </FormikField>

                                        <div css={tw`flex items-center justify-between mb-6 text-xs`}>
                        <label css={tw`flex items-center cursor-pointer text-neutral-400 hover:text-neutral-300 select-none`}>
                            <input
                                type={'checkbox'}
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                css={tw`w-4 h-4 rounded bg-[#131316] border border-neutral-700 text-white focus:ring-0 focus:ring-offset-0 mr-2 cursor-pointer`}
                            />
                            Remember Me
                        </label>
                        <Link
                            to={'/auth/password'}
                            css={tw`text-neutral-400 hover:text-white transition-colors duration-150 no-underline font-medium`}
                        >
                            Forgot Password?
                        </Link>
                    </div>

                                        <button
                        type={'submit'}
                        disabled={isSubmitting}
                        css={[
                            tw`w-full bg-white text-black font-semibold py-2.5 px-4 rounded-lg text-sm shadow-sm transition-all duration-150 flex items-center justify-center cursor-pointer`,
                            isSubmitting
                                ? tw`opacity-70 cursor-not-allowed`
                                : tw`hover:bg-neutral-200 active:bg-neutral-300 hover:shadow`,
                        ]}
                    >
                        {isSubmitting ? (
                            <div css={tw`flex items-center space-x-2`}>
                                <div css={tw`w-4 h-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin`} />
                                <span>Logging in...</span>
                            </div>
                        ) : (
                            'Login'
                        )}
                    </button>

                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setToken('');
                            }}
                        />
                    )}
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
