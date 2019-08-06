import { MessageTriggerEvent, MessageTrigger, TriggerConfig } from '../typings';
import {
    logExecution,
    logInit,
    hasAdminPermissions,
    isConfigured,
    isAllowedChannel,
    authorHasPermission
} from '../utils/trigger-helpers';

export const createMessageTrigger = (messageTrigger: MessageTrigger): MessageTrigger => {
    return messageTrigger;
};

export const createMessageTriggerEvent = (config: TriggerConfig): MessageTriggerEvent => {
    const execute = (): void => {
        const { trigger, message } = config;
        logExecution(config);
        (<MessageTrigger>trigger).execute(message);
    };

    return {
        execute,
        logInit: () => logInit(config),
        isConfigured: () => isConfigured(config),
        isAllowedChannel: () => isAllowedChannel(config),
        hasAdminPermissions: () => hasAdminPermissions(config),
        authorHasPermission: () => authorHasPermission(config)
    };
};
