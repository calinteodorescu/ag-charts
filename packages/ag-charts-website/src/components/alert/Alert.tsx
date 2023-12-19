import styles from '@design-system/modules/Alert.module.scss';
import classNames from 'classnames';
import type { FunctionComponent, ReactNode } from 'react';

import { Icon } from '../icon/Icon';

interface Props {
    type: 'info' | 'idea' | 'warning' | 'default';
    children: ReactNode;
    className?: string;
}

export const Alert: FunctionComponent<Props> = ({ type = 'default', children, className }) => {
    const icon = type !== 'default' ? type : null;

    return (
        <div className={classNames('alert', styles.alert, styles[type], className)}>
            {icon && <Icon name={icon} />}

            <div className={styles.content}>{children}</div>
        </div>
    );
};
