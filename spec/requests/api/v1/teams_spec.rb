# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Teams" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host) { create(:user, :host) }
  let(:team1) { create(:team) }
  let(:team2) { create(:team) }

  describe "#index" do
    path "/api/v1/teams" do
      get "lists teams scoped to the current user" do
        tags "Teams"
        produces "application/json"

        response(200, "returns all teams for admin") do
          before do
            team1
            team2
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(2)
            expect(json_response[:status][:code]).to eq(200)
          end
        end

        response(200, "returns only assigned teams for emcee") do
          before do
            create(:team_membership, user: emcee, team: team1)
            team2
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(1)
            expect(json_response[:data].first[:id]).to eq(team1.id)
          end
        end

        response(200, "returns empty list for emcee with no team assignments") do
          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data]).to be_empty
          end
        end

        response(403, "returns forbidden for host") do
          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized when not signed in") do
          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end
end
