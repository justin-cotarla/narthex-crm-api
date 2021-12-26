import { format as sqlFormat } from 'sql-formatter';

import { NarthexCrmDbDataSource } from '../';
import { RecordTable } from '../../../types/database';

const mockQuery = jest.fn();
const mockErrorLogger = jest.fn();

jest.mock('../../MySqlDataSource', () => ({
    MySqlDataSource: jest.fn().mockImplementation(() => ({
        query: mockQuery,
        context: {
            logger: {
                error: mockErrorLogger,
            },
        },
    })),
}));

const narthexCrmDbDataSource = new NarthexCrmDbDataSource({});

beforeEach(() => {
    mockQuery.mockClear();
    mockErrorLogger.mockClear();
});

describe('logClientConnection', () => {
    it('logs client connections', async () => {
        mockQuery.mockImplementationOnce((): { changedRows: number } => ({
            changedRows: 1,
        }));

        await narthexCrmDbDataSource['logClientConnection'](1);

        expect(mockQuery).toHaveBeenCalledWith({
            sql: sqlFormat(`
                UPDATE
                    client
                SET
                    last_login_timestamp = CURRENT_TIMESTAMP
                WHERE
                    id = ?
            `),
            values: [1],
        });
    });

    it('does not throw an throw an error on failure', async () => {
        mockQuery.mockImplementationOnce((): { changedRows: number } => ({
            changedRows: 0,
        }));

        await narthexCrmDbDataSource['logClientConnection'](1);

        expect(mockQuery).toHaveBeenCalled();
        expect(mockErrorLogger).toBeCalledTimes(1);
    });
});

describe('logRecordChange', () => {
    it('logs record changes', async () => {
        mockQuery.mockImplementationOnce((): { changedRows: number } => ({
            changedRows: 1,
        }));

        await narthexCrmDbDataSource['logRecordChange'](
            RecordTable.MINISTRY,
            1,
            2
        );

        expect(mockQuery).toHaveBeenCalledWith({
            sql: sqlFormat(`
                UPDATE ministry
                SET
                    modified_by = ?,
                    modification_timestamp = CURRENT_TIMESTAMP
                WHERE
                    id = ?
            `),
            values: [2, 1],
        });
    });

    it('does not throw an throw an error on failure', async () => {
        mockQuery.mockImplementationOnce((): { changedRows: number } => ({
            changedRows: 0,
        }));

        await narthexCrmDbDataSource['logRecordChange'](
            RecordTable.MINISTRY,
            1,
            2
        );

        expect(mockQuery).toHaveBeenCalled();
        expect(mockErrorLogger).toBeCalledTimes(1);
    });
});
