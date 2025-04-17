interface SpinnerProps {
    /**
     * Size of the spinner in rem, default 10
     */
    size?: number;

    /**
     * Horizontal alignment of the spinner, default 'center'
     */
    align?: 'left' | 'center' | 'right';
}

export const Spinner = ({size = 10, align = 'center'}: SpinnerProps) => {
    return <div className={`flex-row justify-${align} items-center`}>
    <div style={{fontSize: `${size}rem`}}>
        <div className={'atom-spinner'}>
            <div className={'spinner-inner'}>
                <div className={'spinner-line'}></div>
                <div className={'spinner-line'}></div>
                <div className={'spinner-line'}></div>
                <div className={'spinner-circle'}>
                    <div>●</div>
                </div>
            </div>
        </div>
    </div>
    </div>
}
