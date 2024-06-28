<?php
require_once 'HTTP_STATUS.php';
require_once 'Secrets.php';

// mysqli_report(MYSQLI_REPORT_OFF);
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

class Database
{
    private $conn;
    private $stmt;
    public $error;
    public $errorMessage;
    public $errorCode;
    public $affected_rows;
    protected $preparedTypes;
    private bool $stmt_open = false;

    public function __construct(
        #[SensitiveParameter] array $credentials,
        $readTimeoutSeconds = 1,
        $connectTimeoutSeconds = 1
    ) {
        if ($credentials === null) {
            $this->handleError(
                'No credentials',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                null,
                true
            );
        }
        if (!array_key_exists("hostname", $credentials)) {
            $this->handleError(
                'Missing hostname',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                null,
                true
            );
        }
        if (!array_key_exists("username", $credentials)) {
            $this->handleError(
                'Missing username',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                null,
                true
            );
        }
        if (!array_key_exists("password", $credentials)) {
            $this->handleError(
                'Missing password',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                null,
                true
            );
        }
        if (!array_key_exists("database", $credentials)) {
            $this->handleError(
                'Missing database',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                null,
                true
            );
        }

        try {
            $this->conn = new mysqli(
                $credentials["hostname"],
                $credentials["username"],
                $credentials["password"],
                $credentials["database"]
            );
        } catch (mysql_sql_exception $e) {
            return $this->handleError(
                'Database connection failed.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                $e,
                true
            );
        }

        // Prevent hung resources
        if (!$this->conn->options(
            MYSQLI_OPT_CONNECT_TIMEOUT,
            $connectTimeoutSeconds
        )) {
            $this->handleError(
                'Unable to set connection timeout.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                null,
                false// non-critical
            );
        }
        if (!$this->conn->options(
            MYSQLI_OPT_READ_TIMEOUT,
            $readTimeoutSeconds
        )) {
            $this->handleError(
                'Unable to set read timeout.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                null,
                false// non-critical
            );
        }

        if ($this->conn->connect_error) {
            return $this->handleError(
                'Database connection failed.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                $this->conn->connect_error,
                true
            );
        }
    }
    private function handleError($message, $statusCode, $error, $throw = false)
    {
        $this->errorMessage = $message;
        $this->errorCode = $statusCode;
        $this->error = $error;
        if ($throw) {
            throw new Exception($message, $statusCode, $error);
        }
        return false;
    }
    public function get_last_exception($message = "")
    {
        if (empty($this->errorMessage)) {
            if (empty($message)) {
                return null;
            }
            return new Exception($message);
        }

        $errorMessage = $this->errorMessage;
        $statusCode = $this->errorCode;
        $error = $this->error;
        if (!empty($errorMessage)) {
            $message .= " $errorMessage";
        }
        if (!empty($error)) {
            $message .= " " . $error->getMessage();
        }
        return new Exception($message, $statusCode, $error);
    }
    public function closeStatement()
    {
        if ($this->stmt !== null) {
            if ($this->stmt_open) {
                $this->stmt->close();
            }
        }
        $this->stmt_open = false;
    }
    public function prepare($sql)
    {
        $this->closeStatement();
        $this->stmt = $this->conn->prepare($sql);
        if ($this->stmt === false) {
            return $this->handleError(
                'Unable to prepare SQL statement',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                $this->conn->error
            );
        }
        $this->stmt_open = true;
        return $this->stmt;
    }
    public function prepareWithTypes($sql, $types)
    {
        if ($this->prepare($sql)) {
            $this->preparedTypes = $types;
            return true;
        }
        return false;
    }
    public function bind_param($types = '',  &  ...$values)
    {
        if ($types === '') {
            return true;
        }

        $result = $this->stmt->bind_param($types, ...$values);
        if ($result === false) {
            return $this->handleError(
                'Failed binding parameters.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                $this->stmt->error
            );
        }
        return $result;
    }
    public function result_metadata()
    {
        return $this->stmt->result_metadata();
    }
    public function get_result()
    {
        $result = $this->stmt->get_result();
        if ($result === false) {
            return $this->handleError(
                'Failed getting result.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                $this->stmt->error
            );
        }
        return $result;
    }
    public function free_result()
    {
        return $this->stmt->free_result();
    }
    public function execute()
    {
        $result = $this->stmt->execute();
        if ($result === false) {
            if ($this->stmt->errno == 2006) {
                return $this->handleError(
                    'SQL statement took too long to execute',
                    HTTP_STATUS_GATEWAY_TIMEOUT,
                    $this->stmt->error
                );
            } else {
                return $this->handleError(
                    'Failed executing SQL statement',
                    HTTP_STATUS_INTERNAL_SERVER_ERROR,
                    $this->stmt->error
                );
            }
        }
        $this->affected_rows = $this->conn->affected_rows;
        return $result;
    }
    public function bind_result(&$var,  &  ...$vars)
    {
        $result = $this->stmt->bind_result($var, ...$vars);
        if ($result === false) {
            return $this->handleError(
                'Failed to bind result.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                $this->stmt->error
            );
        }
        return $result;
    }
    public function skip_results()
    {
        do {
            // nothing
        } while ($this->stmt->more_results() && $this->stmt->next_result());
    }
    public function fetch()
    {
        $result = $this->stmt->fetch();
        if ($result === false) {
            return $this->handleError(
                'Failed to fetch using statement.',
                HTTP_STATUS_INTERNAL_SERVER_ERROR,
                $this->stmt->error
            );
        }
        return $result;
    }

    public function close()
    {
        if ($this->stmt) {
            @$this->stmt->close();
            $this->stmt = null;
        }
        if ($this->conn) {
            @$this->conn->close();
            $this->conn = null;
        }
    }
}
