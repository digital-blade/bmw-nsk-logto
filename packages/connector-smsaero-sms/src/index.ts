import type {
  CreateConnector,
  GetConnectorConfig,
  SendMessageFunction,
  SmsConnector,
} from '@logto/connector-kit';
import {
  ConnectorError,
  ConnectorErrorCodes,
  ConnectorType,
  validateConfig,
} from '@logto/connector-kit';
import { assert } from '@silverhand/essentials';
import { got } from 'got';

import { defaultMetadata, endpoint } from './constant.js';
import type { PublicParameters, SmsAeroConfig } from './types.js';
import { smsAeroConfigGuard } from './types.js';

function sendMessage(getConfig: GetConnectorConfig): SendMessageFunction {
  return async (data, inputConfig) => {
    const { to, type, payload } = data;

    const config = inputConfig ?? (await getConfig(defaultMetadata.id));
    validateConfig<SmsAeroConfig>(config, smsAeroConfigGuard);

    const { email, apiKey, senderName, templates } = config;

    const template = templates.find((template) => template.usageType === type);

    assert(
      template,
      new ConnectorError(
        ConnectorErrorCodes.TemplateNotFound,
        `Cannot find template for type: ${type}`
      )
    );

    const parameters: PublicParameters = {
      number: to,
      sign: senderName,
      text: template.content.replace(/{{code}}/g, payload.code),
    };

    try {
      return await got(endpoint, {
        headers: {
          Authorization: 'Basic ' + Buffer.from([email, apiKey].join(':')).toString('base64'),
        },
        searchParams: parameters,
      });
    } catch (error: unknown) {
      console.log(error);

      throw new ConnectorError(ConnectorErrorCodes.General, error);
    }
  };
}

const createSmsAeroConnector: CreateConnector<SmsConnector> = async ({ getConfig }) => {
  return {
    metadata: defaultMetadata,
    type: ConnectorType.Sms,
    configGuard: smsAeroConfigGuard,
    sendMessage: sendMessage(getConfig),
  };
};

export default createSmsAeroConnector;
