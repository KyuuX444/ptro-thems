import React, { forwardRef } from 'react';
import { Form } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
    subtitle?: string;
};

export default forwardRef<HTMLFormElement, Props>(({ title, subtitle, ...props }, ref) => (
    <div css={tw`w-full max-w-[420px] mx-auto`}>
                <div css={tw`text-center mb-6 select-none`}>
            <div
                css={tw`w-12 h-12 rounded-xl bg-[#111114] border border-neutral-800 flex items-center justify-center mx-auto mb-3 shadow-md`}
            >
                <img
                    src={'/favicons/safari-pinned-tab.svg'}
                    alt={'Pterodactyl'}
                    css={tw`w-6 h-6 opacity-90`}
                    style={{ filter: 'invert(1)' }}
                />
            </div>
            <h1 css={tw`text-sm font-semibold tracking-wider text-neutral-300 uppercase text-[11px]`}>
                {window.SiteConfiguration?.name || 'Pterodactyl'}
            </h1>
            <p css={tw`text-[11px] text-neutral-500 mt-0.5 tracking-tight`}>
                Infrastructure Control Panel
            </p>
        </div>

                <div
            css={tw`w-full bg-[#0d0d10] border border-neutral-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm`}
        >
            {title && (
                <div css={tw`mb-6`}>
                    <h2 css={tw`text-xl font-bold tracking-tight text-white`}>{title}</h2>
                    {subtitle && <p css={tw`text-xs text-neutral-400 mt-1`}>{subtitle}</p>}
                </div>
            )}

            <FlashMessageRender css={tw`mb-4 text-xs`} />

            <Form {...props} ref={ref}>
                {props.children}
            </Form>
        </div>

                <div css={tw`text-center mt-6 text-xs text-neutral-500 space-y-1`}>
            <p css={tw`text-[11px] text-neutral-400`}>
                {window.SiteConfiguration?.name || 'Pterodactyl'} &bull; v1.15.2
            </p>
            <p css={tw`text-[10px] text-neutral-600`}>
                &copy; 2015 - {new Date().getFullYear()} All rights reserved.
            </p>
        </div>
    </div>
));
