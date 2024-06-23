<?php
require_once 'Database.php';

class DatabaseHelper extends Database
{
    public function preparedExecute(...$values)
    {
        $typeCount = strlen($this->preparedTypes);
        $valueCount = count($values);
        if ($valueCount !== $typeCount) {
            throw new Exception("Count mismatch. Types: $typeCount != Values: $valueCount");
        }
        if (
            $this->bind_param($this->preparedTypes, ...$values) &&
            $this->execute()
        ) {
            return true;
        }
        return false;
    }
    public function selectPreparedScalar(...$values)
    {
        if (
            $this->preparedExecute(...$values) &&
            $this->bind_result($scalar) &&
            $this->fetch()
        ) {
            $this->free_result();
            //$this->closeStatement();
            return $scalar;
        }
        return false;
    }
    public function selectScalar(string $sql, ?string $types = '', ...$values)
    {
        if (
            $this->prepare($sql) &&
            $this->bind_param($types, ...$values) &&
            $this->execute() &&
            $this->bind_result($scalar) &&
            $this->fetch()
        ) {
            return $scalar;
        }
        return false;
    }
    public function selectRows($sql, ?string $types = '', ...$values)
    {
        if (
            $this->prepare($sql) &&
            ($types == '' || $this->bind_param($types, ...$values)) &&
            $this->execute()
        ) {
            if ($this->affected_rows === 0) {
                return array();
            }
            $result = $this->get_result();
            if ($result === false) {
                return false;
            }
            $rows = $result->fetch_all(MYSQLI_ASSOC);
            $result->free();
            // $this->free_result();
            $this->skip_results();
            $this->closeStatement();
            return $rows;
        }
        return false;
    }
    public function affectAny($sql, $types, ...$values)
    {
        return $this->prepare($sql) &&
        $this->bind_param($types, ...$values) &&
        $this->execute();
    }
    public function affectOne($sql, $types, ...$values)
    {
        return $this->prepare($sql) &&
        $this->bind_param($types, ...$values) &&
        $this->execute() &&
        $this->affected_rows === 1;
    }
    public function affectOneOrTwo($sql, $types, ...$values)
    {
        return $this->prepare($sql) &&
        $this->bind_param($types, ...$values) &&
        $this->execute() &&
        $this->affected_rows === 1 || $this->affected_rows === 2;
    }
}
