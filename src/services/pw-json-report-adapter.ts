import { PwReport, PwSpec, PwSuite } from "@/types/playwright-report"
import { Execution, Report, Statistics, Status, Suite, Test } from "@/types/report"

import playwrightReport from '../../test-results-3-projects.json';
import { newUuid } from "./uuid-factory";

export function getFromReportFile(): Report {
  return convertReport(playwrightReport)
}

export function convertReport(source: PwReport): Report {
  const suite = convertSuiteArray(source.suites);
  const report: Report = {
    tests: {
      uuid: newUuid(),
      name: '',
      tests: suite,
    },
  };
  return report;
}

function convertSuiteArray(source: PwSuite[]): (Suite | Test)[] {
  return source.map((suite) => {
    return convertPwSuite(suite);
  });
}

function convertPwSuite(source: PwSuite): Suite {
  if (source.title == source.file && source.suites?.length == 1) source = source.suites[0];

  return {
    uuid: newUuid(),
    name: buildGroupName(source),
    tests: convertSuiteArray(source.suites || []).concat(convertSpecArray(source.specs)),
  };
}

function buildGroupName(source: PwSuite) {
  return source.title == source.file
    ? capitalizeFirstLetter(source.title.replace('.ts', '').replace('.spec', '').replace('-', ' '))
    : source.title;
}

function capitalizeFirstLetter(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function convertSpecArray(source: PwSpec[]): Test[] {
  const groupByFileAndLine = new Map<string, PwSpec[]>();
  const target: Test[] = [];

  source.forEach((each) => {
    const key: string = each.file + ':' + each.line;
    if (!groupByFileAndLine.has(key)) groupByFileAndLine.set(key, []);
    groupByFileAndLine.get(key)?.push(each);
  });

  groupByFileAndLine.forEach((group) => {
    const executions: Execution[] = group.map((spec) => {
      const error = spec.tests[0]?.results[0]?.error;
      return {
        name: spec.tests[0].projectName,
        status: spec.ok ? Status.success : Status.failed,
        error,
      };
    });
    target.push({
      name: group[0].title,
      uuid: newUuid(),
      executions: executions,
      stats: new Statistics(),
    });
  });

  return target;
}