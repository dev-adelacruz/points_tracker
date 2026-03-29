# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Company Scoping" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:company) { create(:company) }
  let(:admin) { create(:user, :admin, company: company) }
  let(:other_company) { create(:company, name: "Other Company") }

  describe "teams are scoped to the current company" do
    path "/api/v1/teams" do
      get "returns only teams belonging to Company.first" do
        tags "Company Scoping"
        produces "application/json"

        response(200, "excludes teams from other companies") do
          let(:team_a) { create(:team, company: company) }

          before do
            team_a
            create(:team, company: other_company)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:id]).to eq(team_a.id)
          end
        end
      end
    end
  end

  describe "hosts are scoped to the current company" do
    path "/api/v1/hosts" do
      get "returns only hosts belonging to Company.first" do
        tags "Company Scoping"
        produces "application/json"

        response(200, "excludes hosts from other companies") do
          let(:host_a) { create(:user, :host, company: company) }

          before do
            host_a
            create(:user, :host, company: other_company)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:id]).to eq(host_a.id)
          end
        end
      end
    end
  end
end
