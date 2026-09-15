import type { SVGProps } from 'react';

/**
 * La fachada del HUV en trazo, tomada del logo institucional. Es decorativa: se usa a baja
 * opacidad en el saludo y en los estados vacíos, y hereda el color con `currentColor`.
 */
export function HuvBuilding(props: SVGProps<SVGSVGElement>) {
    const ventanas = (x0: number) =>
        [0, 42, 84].flatMap((dx) => [
            `M${x0 + dx} 84V120`,
            `M${x0 + dx} 142V182`,
            `M${x0 + dx} 202V242`,
        ]);

    return (
        <svg viewBox="0 0 640 300" fill="none" aria-hidden="true" focusable="false" {...props}>
            <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {/* Cornisa */}
                <path d="M60 22H580" />
                {/* Alas: pisos */}
                <path d="M64 72H252M64 128H252M64 190H252M64 250H252" />
                <path d="M388 72H576M388 128H576M388 190H576M388 250H576" />
                {/* Alas: ventanas */}
                <path d={[...ventanas(112), ...ventanas(444)].join('')} />
                {/* Torre central y remate */}
                <path d="M252 270V64H388V270" />
                <path d="M296 64V50H344V64M290 50H350" />
                {/* Marquesinas y columnas de la entrada */}
                <path d="M270 128H370L360 138H280Z" />
                <path d="M282 138V196M288 138V196M352 138V196M358 138V196" />
                <path d="M306 144V190M320 144V190M334 144V190" />
                <path d="M262 196H378L366 206H274Z" />
                <path d="M282 206V270M288 206V270M352 206V270M358 206V270" />
                {/* Escalinata y colina */}
                <path d="M292 276H348M286 282H354M280 288H360" />
                <path d="M24 296Q320 240 616 296" />
            </g>
            <text
                x="320"
                y="106"
                textAnchor="middle"
                fill="currentColor"
                fontSize="22"
                fontWeight={500}
                letterSpacing="4"
            >
                H.U.V
            </text>
        </svg>
    );
}
