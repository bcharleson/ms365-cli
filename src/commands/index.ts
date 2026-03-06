import { Command } from 'commander';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';
import { getAccessToken } from '../core/auth.js';
import { GraphClient } from '../core/client.js';
import { output, outputError } from '../core/output.js';

// Auth (special — no API client needed)
import { registerLoginCommand } from './auth/login.js';
import { registerLogoutCommand } from './auth/logout.js';
import { registerStatusCommand } from './auth/status.js';

// MCP server command
import { registerMcpCommand } from './mcp/index.js';

// Mail
import {
  mailListCommand,
  mailGetCommand,
  mailSendCommand,
  mailReplyCommand,
  mailDeleteCommand,
  mailSearchCommand,
  mailUnreadCountCommand,
  mailMoveCommand,
  mailAttachmentsListCommand,
  mailAttachmentsGetCommand,
} from './mail/index.js';

// Calendar
import {
  calendarListCommand,
  calendarGetCommand,
  calendarCreateCommand,
  calendarUpdateCommand,
  calendarDeleteCommand,
} from './calendar/index.js';

// Drive
import {
  driveListCommand,
  driveGetCommand,
  driveSearchCommand,
  driveDeleteCommand,
  driveDownloadCommand,
} from './drive/index.js';

// Contacts
import {
  contactsListCommand,
  contactsGetCommand,
  contactsSearchCommand,
  contactsCreateCommand,
} from './contacts/index.js';

export const allCommands: CommandDefinition[] = [
  // Mail
  mailListCommand,
  mailGetCommand,
  mailSendCommand,
  mailReplyCommand,
  mailDeleteCommand,
  mailSearchCommand,
  mailUnreadCountCommand,
  mailMoveCommand,
  mailAttachmentsListCommand,
  mailAttachmentsGetCommand,
  // Calendar
  calendarListCommand,
  calendarGetCommand,
  calendarCreateCommand,
  calendarUpdateCommand,
  calendarDeleteCommand,
  // Drive
  driveListCommand,
  driveGetCommand,
  driveSearchCommand,
  driveDeleteCommand,
  driveDownloadCommand,
  // Contacts
  contactsListCommand,
  contactsGetCommand,
  contactsSearchCommand,
  contactsCreateCommand,
];

export function registerAllCommands(program: Command): void {
  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerStatusCommand(program);
  registerMcpCommand(program);

  const groups = new Map<string, CommandDefinition[]>();
  for (const cmd of allCommands) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)!.push(cmd);
  }

  for (const [groupName, commands] of groups) {
    const groupCmd = program
      .command(groupName)
      .description(`Manage ${groupName}`);

    for (const cmdDef of commands) {
      registerCommand(groupCmd, cmdDef);
    }

    groupCmd.on('command:*', (operands: string[]) => {
      const available = commands.map((c) => c.subcommand).join(', ');
      console.error(`error: unknown command '${operands[0]}' for '${groupName}'`);
      console.error(`Available: ${available}`);
      process.exitCode = 1;
    });
  }
}

function registerCommand(parent: Command, cmdDef: CommandDefinition): void {
  const cmd = parent
    .command(cmdDef.subcommand)
    .description(cmdDef.description);

  if (cmdDef.cliMappings.args) {
    for (const arg of cmdDef.cliMappings.args) {
      cmd.argument(arg.required ? `<${arg.name}>` : `[${arg.name}]`, arg.field);
    }
  }

  if (cmdDef.cliMappings.options) {
    for (const opt of cmdDef.cliMappings.options) {
      cmd.option(opt.flags, opt.description ?? '');
    }
  }

  if (cmdDef.examples?.length) {
    cmd.addHelpText('after', '\nExamples:\n' + cmdDef.examples.map((e) => `  $ ${e}`).join('\n'));
  }

  cmd.action(async (...actionArgs: any[]) => {
    try {
      const globalOpts = cmd.optsWithGlobals() as GlobalOptions & Record<string, any>;
      if (globalOpts.pretty) globalOpts.output = 'pretty';

      const client = new GraphClient({ getToken: getAccessToken });
      const input: Record<string, any> = {};

      if (cmdDef.cliMappings.args) {
        for (let i = 0; i < cmdDef.cliMappings.args.length; i++) {
          if (actionArgs[i] !== undefined) {
            input[cmdDef.cliMappings.args[i].field] = actionArgs[i];
          }
        }
      }

      if (cmdDef.cliMappings.options) {
        for (const opt of cmdDef.cliMappings.options) {
          const match = opt.flags.match(/--([a-z-]+)/);
          if (match) {
            const optName = match[1].replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
            if (globalOpts[optName] !== undefined) {
              input[opt.field] = globalOpts[optName];
            }
          }
        }
      }

      const parsed = cmdDef.inputSchema.safeParse(input);
      if (!parsed.success) {
        const issues = parsed.error.issues ?? [];
        const missing = issues
          .filter((i: any) => i.code === 'invalid_type' && String(i.message).includes('received undefined'))
          .map((i: any) => '--' + String(i.path?.[0] ?? '').replace(/_/g, '-'));
        if (missing.length > 0) {
          throw new Error(`Missing required option(s): ${missing.join(', ')}`);
        }
        throw new Error(`Invalid input: ${issues.map((i: any) => `${i.path?.join('.')}: ${i.message}`).join('; ')}`);
      }

      const result = await cmdDef.handler(parsed.data, client);
      output(result, globalOpts);
    } catch (error) {
      outputError(error, cmd.optsWithGlobals() as GlobalOptions);
    }
  });
}
