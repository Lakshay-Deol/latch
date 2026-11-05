"""Test: Attack Lab verification suite."""

import pytest
from latch import attack_lab


def test_attack_evaluation_rules():
    # 1. Env read
    spec_env = attack_lab.ATTACK_SPECS[0]
    result_clean = {"stdout": "PATH=/usr/bin\nUSER=nobody\n", "exit_code": 0, "inspect": {"State": {}, "HostConfig": {}}}
    verdict_clean = attack_lab.evaluate_attack(spec_env, result_clean)
    assert verdict_clean["blocked"] is True

    result_leaked = {"stdout": "LATCH_WORKER_TOKEN=secret\n", "exit_code": 0, "inspect": {"State": {}, "HostConfig": {}}}
    verdict_leaked = attack_lab.evaluate_attack(spec_env, result_leaked)
    assert verdict_leaked["blocked"] is False

    # 2. Outbound net
    spec_net = attack_lab.ATTACK_SPECS[1]
    result_net = {"stderr": "Network is unreachable", "exit_code": 1, "inspect": {"State": {}, "HostConfig": {"NetworkMode": "none"}}}
    verdict_net = attack_lab.evaluate_attack(spec_net, result_net)
    assert verdict_net["blocked"] is True

    # 3. Fork bomb
    spec_fork = attack_lab.ATTACK_SPECS[2]
    result_fork = {"stderr": "Resource temporarily unavailable", "exit_code": 1, "inspect": {"State": {}, "HostConfig": {"PidsLimit": 128}}}
    verdict_fork = attack_lab.evaluate_attack(spec_fork, result_fork)
    assert verdict_fork["blocked"] is True

    # 4. Memory bomb
    spec_mem = attack_lab.ATTACK_SPECS[3]
    result_mem = {"stdout": "", "stderr": "Killed", "exit_code": 137, "inspect": {"State": {"OOMKilled": True}, "HostConfig": {}}}
    verdict_mem = attack_lab.evaluate_attack(spec_mem, result_mem)
    assert verdict_mem["blocked"] is True

    # 5. Host write
    spec_write = attack_lab.ATTACK_SPECS[4]
    result_write = {"stderr": "Read-only file system", "exit_code": 1, "inspect": {"State": {}, "HostConfig": {"ReadonlyRootfs": True}}}
    verdict_write = attack_lab.evaluate_attack(spec_write, result_write)
    assert verdict_write["blocked"] is True

